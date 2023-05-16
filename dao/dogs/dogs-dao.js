import { Dog } from "../../models/dog";
import { Centre } from "../../models/centre";
import mongoose from "mongoose";
import invalid from "../validator";

const createDog = async (dog) => {
  const dogInstance = new Dog(dog);
  await dogInstance.save();

  console.log("line 7: " + dogInstance);
  return dogInstance;
};

const retrieveAllDogsInCentre = async (centreId) => {
  if (invalid(centreId)) {
    return null;
  }
  const centre = await Centre.findById(centreId).populate("dogs");

  return centre.dogs;
};

const retrieveSingleDogInCentre = async (centreId, dogId) => {
  if (invalid(centreId) || invalid(dogId)) {
    return null;
  }
  // get the centre document and populate the dogs field
  const centre = await Centre.findById(centreId).populate("dogs");

  console.log(centre.dogs);
  console.log("line 26 " + dogId);

  // get the dog document
  const dog = centre.dogs.find((dog) => dog._id.toString() === dogId);

  console.log("line 30 " + dog);
  return dog;
};

const deleteDog = async (dogId) => {
  if (invalid(dogId)) {
    return null;
  }
  await Dog.deleteOne({ _id: dogId });
};

const updateDog = async (newDog) => {
  const updatedDog = await Dog.findOneAndUpdate({ _id: newDog._id }, newDog);

  // return boolean which outlines whether the operation was successful or not
  return updatedDog !== undefined;
};

const updateDogImage = async (DogId, image) => {
  if (invalid(DogId)) {
    return null;
  }
  const dog = await Dog.findById(DogId);
  dog.imageName = image;
  await dog.save();
};

const getDogById = async (dogId) => {
  if (invalid(dogId)) {
    return null;
  }
  return await Dog.findById(dogId);
};

const updateDogWeight = async (dogId, weight) => {
  if (invalid(dogId)) {
    return null;
  }
  const dog = await getDogById(dogId);
  dog.weights.push(weight);

  await dog.save();
};

const setIsBeingWeighed = async (dogId, value) => {
  if (invalid(dogId)) {
    return null;
  }

  const dog = await getDogById(dogId);
  dog.isBeingWeighed = value;

  await dog.save();
};

const retrieveTimestampDog = async (dogId) => {
  if (invalid(dogId)) {
    return null;
  }
  const dog = await getDogById(dogId);

  console.log("dog : " + dog, 70);

  // get the length of the array
  const dogWeightsSize = dog.weights.length;

  console.log("dog weights array size: ", dogWeightsSize, 75);

  if (dogWeightsSize === 0) {
    return null;
  }

  // get the last element in the array
  const timestamp = dog.weights[dogWeightsSize - 1].timestamp;

  console.log("dog weight object: ", dog.weights[dogWeightsSize - 1], 75);

  //const formattedDate = moment(timestamp).format('YYYY-MM-DDTHH:mm:ss.sssZ');

  console.log("the timestamp of the latest dog weight is: ", timestamp);

  return timestamp;
};

const getLatestDogWeight = async (dogId) => {
  if (invalid(dogId)) {
    return null;
  }
  const dog = await getDogById(dogId);
  const dogWeightsSize = dog.weights.length;

  // get the last element in the array
  const latestWeight = dog.weights[dogWeightsSize - 1];

  console.log("latest weight for the dog: " + latestWeight);

  return latestWeight;
};

const registerWeightToDog = async (dogId, weight) => {
  if (invalid(dogId)) {
    return null;
  }

  console.log("line 102: ", dogId, 102);
  const dog = await getDogById(dogId);

  const timestamp = new Date(Date.now());

  console.log("recorded time of the dog weight: ", timestamp, 112);

  const weightObj = {
    weight: weight,
    timestamp: timestamp,
  };

  console.log("latest weight obj", weightObj, 119);

  dog.weights.push(weightObj);

  await dog.save();

  return dog.weights;
};

export {
  createDog,
  retrieveAllDogsInCentre,
  retrieveSingleDogInCentre,
  deleteDog,
  updateDog,
  getDogById,
  updateDogWeight,
  setIsBeingWeighed,
  retrieveTimestampDog,
  getLatestDogWeight,
  registerWeightToDog,
  updateDogImage,
};
