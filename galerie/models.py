from flask import Flask, request, jsonify
from PIL import Image
import io
import cv2
import numpy as np
from scipy.stats import skew
from flask_cors import CORS, cross_origin
from sklearn.cluster import KMeans
from skimage.feature import graycomatrix, graycoprops
import matplotlib
from pymongo import MongoClient
import filetype


matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
db = client["galerie"]


def calculate_histogram(image):
    colors = ("b", "g", "r")

    result = []
    for i, color in enumerate(colors):
        histo = cv2.calcHist([image], [i], None, [256], [0, 256])
        result.append(histo.tolist())
    return result


def calculate_color_moments(image):
    img_hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    moments = {}
    for i, color in enumerate(["Hue", "Saturation", "Value"]):
        data = img_hsv[:, :, i].reshape(-1)
        mean = np.mean(data)
        std = np.std(data)
        skewness = skew(data)
        if np.isnan(skewness):
            skewness = 0
        moments[color] = {
            "mean": mean,
            "std": std,
            "skewness": skewness,
        }
    return moments


def calculate_dominant_color(image):
    nbreDominantColors = 10
    # Check the number of channels in the image
    if image.ndim == 2:
        # Grayscale image, duplicate it into 3 channels
        image = np.stack([image] * 3, axis=-1)
    elif image.shape[2] == 4:
        # RGBA image, convert to RGB
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    img_resized = cv2.resize(image, (50, int(50 * (image.shape[0] / image.shape[1]))))
    examples = img_resized.reshape((img_resized.shape[0] * img_resized.shape[1], 3))
    kmeans = KMeans(n_clusters=nbreDominantColors)
    kmeans.fit(examples)
    colors = kmeans.cluster_centers_.astype(int)
    dominant_colors = colors.tolist()

    return dominant_colors


# Function to calculate contrast
def calculate_contrast(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    glcm = graycomatrix(gray, [1], [0], 256, symmetric=True, normed=True)
    contrast = graycoprops(glcm, "contrast")[0, 0]
    return contrast


# Function to calculate directionality
def calculate_directionality(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1)
    mag, angle = cv2.cartToPolar(gx, gy)
    directionality = np.sum(angle) / (np.pi * 2 * np.prod(gray.shape))
    return directionality


# Function to calculate roughness
def calculate_roughness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    roughness = np.std(gray)
    return roughness


# Function to calculate linelikeness
def calculate_linelikeness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    linelikeness = np.sum(edges) / np.prod(gray.shape)
    return linelikeness


# Function to calculate regularity
def calculate_regularity(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    glcm = graycomatrix(gray, [1], [0], 256, symmetric=True, normed=True)
    regularity = graycoprops(glcm, "homogeneity")[0, 0]
    return regularity


# Function to calculate coarseness
def calculate_coarseness(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    average_gray = cv2.blur(gray, (5, 5))
    coarseness = np.average(np.abs(gray - average_gray))
    return coarseness


def build_filters():
    filters = []
    ksize = 31
    for theta in np.arange(0, np.pi, np.pi / 4):
        for sigma in [1, 3, 5]:
            kern = cv2.getGaborKernel(
                (ksize, ksize), sigma, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F
            )
            kern /= 1.5 * kern.sum()
            filters.append(kern)
    return filters


def process(image, filters):
    accum = np.zeros((image.shape[0], image.shape[1], len(filters)), dtype=np.float32)
    for i, kern in enumerate(filters):
        fimg = cv2.filter2D(image, cv2.CV_32F, kern)
        if fimg.ndim == 3:
            fimg = cv2.cvtColor(fimg, cv2.COLOR_BGR2GRAY)
        np.maximum(accum[:, :, i], fimg, accum[:, :, i])
    return accum


@app.route("/album/process", methods=["POST"])
@cross_origin()
def process_images():
    if "files" not in request.files:
        return {"status": False, "message": "No file part in the request."}, 400

    files = request.files.getlist("files")
    results = []

    for file in files:
        img_io = io.BytesIO(file.read())
        img_pil = Image.open(img_io)
        img_cv = np.array(img_pil)
        img_cv = img_cv[:, :, ::-1].copy()

        kind = filetype.guess_mime(img_io.getvalue())
        if kind is None:
            return {"status": False, "message": "Unsupported image type."}, 400

        file_type = kind.split("/")[-1]  # Get the file extension from the MIME type

        _, img_bytes = cv2.imencode("." + file_type, img_cv)
        img_base64 = base64.b64encode(img_bytes).decode("utf-8")

        histogram = calculate_histogram(img_cv)
        color_moments = calculate_color_moments(img_cv)
        dominant_color = calculate_dominant_color(img_cv)
        contrast = calculate_contrast(img_cv)
        directionality = calculate_directionality(img_cv)
        roughness = calculate_roughness(img_cv)
        linelikeness = calculate_linelikeness(img_cv)
        regularity = calculate_regularity(img_cv)
        coarseness = calculate_coarseness(img_cv)

        # Add Gabor filter feature
        filters = build_filters()
        res1 = process(img_cv, filters)
        res1 = res1.reshape(-1, res1.shape[-1])
        res1 = np.mean(res1, axis=0)
        gabor_feature = res1.tolist()

        # Insert the image data into MongoDB
        image_data = {
            "user_id": request.form.get("user"),
            "category": request.form.get("category"),
            "filename": request.form.get("filename"),
            "content_type": request.form.get("contentType"),
            "image_data": img_base64,  # Store the image data as base64 string
            "characteristics": {
                "histogram": histogram,
                "color_moments": color_moments,
                "dominant_color": dominant_color,
                "tamura": {
                    "contrast": contrast,
                    "directionality": directionality,
                    "roughness": roughness,
                    "linelikeness": linelikeness,
                    "regularity": regularity,
                    "coarseness": coarseness,
                },
                "gabor_feature": gabor_feature,
            },
        }
        db.images.insert_one(image_data)

        results.append(
            {
                "characteristics": {
                    "histogram": histogram,
                    "color_moments": color_moments,
                    "dominant_color": dominant_color,
                    "tamura": {
                        "contrast": contrast,
                        "directionality": directionality,
                        "roughness": roughness,
                        "linelikeness": linelikeness,
                        "regularity": regularity,
                        "coarseness": coarseness,
                    },
                    "gabor_feature": gabor_feature,
                },
            }
        )

    return jsonify(results), 200


@app.route("/album/images/<user_id>", methods=["GET"])
@cross_origin()
def get_images_by_user(user_id):
    # Query MongoDB for images based on the user ID
    images = db.images.find({"user_id": user_id})

    results = []
    for image in images:
        results.append(
            {
                "_id":  str(image["_id"]),
                "filename": image["filename"],
                "category":image["category"],
                "content_type": image["content_type"],
                "image_data": image["image_data"],
            }
        )

    return jsonify(results), 200

@app.route("/album/search", methods=["POST"])
@cross_origin()
def search_images():
    if "files" not in request.files:
        return {"status": False, "message": "No file part in the request."}, 400

    files = request.files.getlist("files")
    results = []

    for file in files:
        img_io = io.BytesIO(file.read())
        img_pil = Image.open(img_io)
        img_cv = np.array(img_pil)
        img_cv = img_cv[:, :, ::-1].copy()

        kind = filetype.guess_mime(img_io.getvalue())
        if kind is None:
            return {"status": False, "message": "Unsupported image type."}, 400

        file_type = kind.split("/")[-1]  # Get the file extension from the MIME type

        _, img_bytes = cv2.imencode("." + file_type, img_cv)
        img_base64 = base64.b64encode(img_bytes).decode("utf-8")

    # Extract features from the query image
    histogram = calculate_histogram(img_cv)
    color_moments = calculate_color_moments(img_cv)
    dominant_color = calculate_dominant_color(img_cv)
    contrast = calculate_contrast(img_cv)
    directionality = calculate_directionality(img_cv)
    roughness = calculate_roughness(img_cv)
    linelikeness = calculate_linelikeness(img_cv)
    regularity = calculate_regularity(img_cv)
    coarseness = calculate_coarseness(img_cv)

    # Add Gabor filter feature
    filters = build_filters()
    res1 = process(img_cv, filters)
    res1 = res1.reshape(-1, res1.shape[-1])
    res1 = np.mean(res1, axis=0)
    gabor_feature = res1.tolist()

    images = db.images.find({})
    results = []
    for image in images:
        # Calculate the distance between the query image and the database image
        distance = calculate_distance(
            histogram,
            color_moments,
            dominant_color,
            contrast,
            directionality,
            roughness,
            linelikeness,
            regularity,
            coarseness,
            gabor_feature,
            image["characteristics"],
        )
    
        # Convert the ObjectId to a string before adding it to the image dictionary
        image["_id"] = str(image["_id"])
    
        # Add the image and its distance to the results list
        results.append({"image": image, "distance": distance})
    
    # Rank the images based on their similarity to the query image
    results = sorted(results, key=lambda x: x["distance"])
    
    # Return the top N similar images
    n = request.args.get("n", default=15, type=int)
    results = results[:n]
    
    # Convert the ObjectId to a string before returning the JSON response
    results = [
        {
            "image": {
                "_id": str(result["image"]["_id"]),
                "filename": result["image"]["filename"],
                "content_type":result["image"]["content_type"],
                "image_data":result["image"]["image_data"],
            },
            "distance": result["distance"],
        }
        for result in results
    ]
    
    return jsonify(results), 200

def calculate_distance(
    histogram1,
    color_moments1,
    dominant_color1,
    contrast1,
    directionality1,
    roughness1,
    linelikeness1,
    regularity1,
    coarseness1,
    gabor_feature1,
    characteristics2,
):
    # Calculate the distance between the histograms
    histogram2 = characteristics2["histogram"]
    histogram_distance = np.linalg.norm(np.array(histogram1) - np.array(histogram2))
    # Calculate the distance between the color moments
    color_moments2 = characteristics2["color_moments"]
    hue_distance = np.abs(color_moments1["Hue"]["mean"] - color_moments2["Hue"]["mean"])
    saturation_distance = np.abs(
        color_moments1["Saturation"]["mean"] - color_moments2["Saturation"]["mean"]
    )
    value_distance = np.abs(
        color_moments1["Value"]["mean"] - color_moments2["Value"]["mean"]
    )
    color_moments_distance = hue_distance + saturation_distance + value_distance

    # Calculate the distance between the dominant colors
    dominant_color2 = characteristics2["dominant_color"]
    dominant_color_distance = np.linalg.norm(
        np.array(dominant_color1) - np.array(dominant_color2)
    )

    # Calculate the distance between the Tamura features
    tamura2 = characteristics2["tamura"]
    contrast2 = tamura2["contrast"]
    directionality2 = tamura2["directionality"]
    roughness2 = tamura2["roughness"]
    linelikeness2 = tamura2["linelikeness"]
    regularity2 = tamura2["regularity"]
    coarseness2 = tamura2["coarseness"]
    tamura_distance = (
        np.abs(contrast1 - contrast2)
        + np.abs(directionality1 - directionality2)
        + np.abs(roughness1 - roughness2)
        + np.abs(linelikeness1 - linelikeness2)
        + np.abs(regularity1 - regularity2)
        + np.abs(coarseness1 - coarseness2)
    )

    # Calculate the distance between the Gabor filter features
    gabor_feature2 = characteristics2["gabor_feature"]
    gabor_feature_distance = np.linalg.norm(
        np.array(gabor_feature1) - np.array(gabor_feature2)
    )

    # Calculate the total distance
    distance = (
        histogram_distance
        + color_moments_distance
        + dominant_color_distance
        + tamura_distance
        + gabor_feature_distance
    )

    return distance


if __name__ == "__main__":
    app.run(debug=True)
