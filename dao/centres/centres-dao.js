import { Centre } from "../../models/centre";
import { Dog } from "../../models/dog";
import mongoose from "mongoose";
import Scale from "../../models/scale";
import invalidId from "../validator";

const retrieveSingleCentre = async (id) => {
  if (invalidId(id)) {
    return null;
  }

  return await Centre.findById(id).populate("scales");
};

const addDogToCentre = async (centreId, dogId) => {
  if (invalidId(centreId) || invalidId(dogId)) {
    return null;
  }
  // fetch the centre and the dog objects from the db
  const centre = await retrieveSingleCentre(centreId);
  const dog = await Dog.findById(dogId);

  // register the dog to that specific centre
  centre.dogs.push(dog._id);

  // save the updated centre instance
  await centre.save();
};

// add a new centre to the database
const addCentre = async (centre) => {
  const createdCentre = new Centre(centre);
  await createdCentre.save();
  return createdCentre;
};

const deleteDogFromCentre = async (centreId, dogId) => {
  if (invalidId(centreId) || invalidId(dogId)) {
    return null;
  }
  // fetch the centre from db
  const centre = await retrieveSingleCentre(centreId);

  // get array for registered dogs which excludes the one in question
  const updatedDogs = centre.dogs.filter((dog) => dog._id.toString() !== dogId);

  // update the centre document
  centre.dogs = updatedDogs;

  // save the updated document
  await centre.save();
};

const getAllCentre = async () => {
  return await Centre.find();
};

// return center id using its name
const getCentreByName = async (name) => {
  const centre = await Centre.findOne({ name: name });
  return centre;
};

const registerScaleWithCentre = async (scaleId, centreId) => {
  if (invalidId(centreId) || invalidId(scaleId)) {
    return null;
  }
  const centre = await Centre.findById(centreId).populate("scales");
  const scale = await Scale.findById(scaleId);

  centre.scales.push(scale);

  await centre.save();
};

const getUsersRegisteredToCentre = async (centreId) => {};

export {
  retrieveSingleCentre,
  addDogToCentre,
  addCentre,
  deleteDogFromCentre,
  getAllCentre,
  getCentreByName,
  registerScaleWithCentre,
};
