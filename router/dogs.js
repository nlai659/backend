import express from "express";
import {
  createDog,
  deleteDog,
  updateDog,
    updateDogWeight,
  updateDogImage,
  retrieveAllDogsInCentre,
    retrieveSingleDogInCentre,
} from "../dao/dogs/dogs-dao";

import {
  addDogToCentre,
  deleteDogFromCentre,
} from "../dao/centres/centres-dao";
import { authenticateToken, isVolunteer } from "../middleware/authMiddleware";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dogsRouter = new express.Router();

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const routerPath = __dirname.split("\\");
        let backendPath = routerPath[0];
        for (let i = 1; i < routerPath.length - 1; i++) {
            backendPath = backendPath + "\\" + routerPath[i];
        }
        const imagePath = backendPath + "\\public\\dog_profile_images";
        cb(null,imagePath);
    },
    filename: (req, file, cb) => {
        const fileName = `${getRandomNumber()}.${file.mimetype.split("/")[1]}`;
        cb(null, fileName);
    }
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpg" || file.mimetype.split("/")[1] === "png" || file.mimetype.split("/")[1] === "jpeg") {
        cb(null, true);
    } else {
        cb(new Error("Not an image file!"), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

const getRandomNumber = () => {
    return Math.floor(Math.random() * Math.pow(10, 9));
}

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_NO_CONTENT = 204;

// endpoint 1: add a new dog to a specific centre
dogsRouter.post("/centres/:centreId/dogs", async (req, res) => {
  // get the centre id path param from request
    const centreId = req.params.centreId;

    // get dog object from body
    const dog = req.body.dog;

  // create new dog instance
    const newDog = await createDog(dog);

  // error if the req.body wasnt right
  if (!newDog) {
    res.status(422).send("Incorrect format in request payload.");
  }

  // add dog to centre
  await addDogToCentre(centreId, newDog._id);

  return res
    .status(HTTP_CREATED)
      .json(newDog._id.toString());
});

// endpoint 2: get all dogs registered to a specific centre
dogsRouter.get("/centres/:centreId/dogs" , async (req, res) => {
  // get the centre id path param from request
  const centreId = req.params.centreId;

  const dogs = await retrieveAllDogsInCentre(centreId);

  // automatically provides status code of 200 - OK
  return res.json(dogs);
});

// endpoint 3: retrieve a single dog from a specific centre
dogsRouter.get("/centres/:centreId/dogs/:dogId", async (req, res) => {
  // get the centre id and the dog id path param from request
  const centreId = req.params.centreId;
  const dogId = req.params.dogId;

  const foundDog = await retrieveSingleDogInCentre(centreId, dogId);
  console.log("print line 59 " + foundDog);

  if (!foundDog) {
    return res.sendStatus(HTTP_NOT_FOUND);
  }

  return res.json(foundDog);
});

// endpoint 4: remove a dog from a specific centre
dogsRouter.delete("/centres/:centreId/dogs/:dogId", async (req, res) => {
  // get the centre id and the dog id path param from request
  const centreId = req.params.centreId;
  const dogId = req.params.dogId;

  // remove the dog from the centre array
  await deleteDogFromCentre(centreId, dogId);

  // delete the dog instance
  await deleteDog(dogId);

  res.sendStatus(HTTP_NO_CONTENT);
});

// endpoint 5: update the details of a dog
dogsRouter.put("/centres/:centreId/dogs/:dogId", async (req, res) => {
  // get the dog id from the path param
  const dogId = req.params.dogId;

  // get the updated dog object from the request body
  const newDog = req.body;

  // add the _id field to the req body json
  newDog._id = dogId;

  // update the dog
  const outcome = await updateDog(newDog);

  // since the corresponding centre only stores a array of object id's for the dogs
  // it should update that automatically

  // based on whether the update was successful or not, return status code
  res.sendStatus(outcome ? HTTP_NO_CONTENT : HTTP_NOT_FOUND);
});

// endpoint 6: update the weight of a dog
dogsRouter.put("/centres/:centreId/dogs/:dogId/weight", async (req, res) => {
  // get the dog id from the path param
  const dogId = req.params.dogId;

  // get the weight from the request body
  const weight = req.body;

  console.log("line 117 " + weight);

  // generate field for the timestamp
  const date = new Date();
  const timestamp = date.getTime();
  weight.timestamp = timestamp;

  console.log("line 125 " + weight);

  await updateDogWeight(dogId, weight);

  res.sendStatus(HTTP_NO_CONTENT);
});

// endpoint 7: add a picture of a dog to a specific instance of a dog
dogsRouter.post("/centres/:dogId/dogsImage", upload.single("files"), async (req, res) => {

    // get the dog id from request
    const dogId = req.params.dogId;

    //get the image from the body;
    const image = req.file;

    console.log("In dogImages")
    console.log(dogId);
    console.log(image);

    updateDogImage(dogId, image.filename);

    return res
        .status(HTTP_OK);
});

export default dogsRouter;
