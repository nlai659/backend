import Scale from "../../models/scale.js";
import mongoose from "mongoose";
import { retrieveSingleCentre } from "../centres/centres-dao";
import Centre from "../../models/centre.js";
import invalid from "../validator.js";

const getAllScalesInCentre = async (centreId) => {
  const centre = await retrieveSingleCentre(centreId);
  if (!centre || !centre.scales) {
    return null;
  }

  console.log(centre, 11);
  return centre.scales;
};

const getSingleScaleInCentre = async (centreId, scaleId) => {
  const centre = await retrieveSingleCentre(centreId);

  if (!centre || !centre.scales) {
    return null;
  }
  const scale = centre.scales.find((scale) => scale._id.toString() === scaleId);

  if (!scale) {
    return null;
  }
  const singleScale = await getSingleScale(scaleId);

  console.log(singleScale, 26);

  return singleScale;
};

const getSingleScale = async (scaleId) => {
  if (invalid(scaleId)) {
    return null;
  }
  return await Scale.findById(scaleId);
};

const addScale = async (scale) => {
  const newScale = new Scale(scale);
  console.log(newScale, 44);
  await newScale.save();

  return newScale;
};

const registerCentreWithScale = async (scaleId, centreId) => {
  if (invalid(scaleId) || invalid(centreId)) {
    return null;
  }

  const valid = mongoose.isValidObjectId(centreId);
  if (!valid) {
    throw Error("Not a valid centre id");
  }

  const centre = await Centre.findById(centreId);
  const scale = await Scale.findById(scaleId);

  scale.centreId = centre;

  await scale.save();

  return scale;
};

const setIsReserved = async (id, value) => {
  if (invalid(id)) {
    return null;
  }
  const scale = await Scale.findById(id);

  scale.isReserved = value;

  await scale.save();

  // indicate that it was successful by returning true
  // otherwise return false to indicate failure
  return true;
};

const setIsReservedBy = async (dogId, scaleId) => {
  if (invalid(dogId) || invalid(scaleId)) {
    return null;
  }
  const scale = await Scale.findById(scaleId);
  scale.isReservedBy = dogId;

  await scale.save();
  return scale;
};

const getIsReservedBy = async (scaleId) => {
  if (invalid(scaleId)) {
    return null;
  }
  const scale = await Scale.findById(scaleId);

  return scale.isReservedBy;
};

const checkScaleIsReserved = async (scaleId) => {
  if (invalid(scaleId)) {
    return null;
  }
  const scale = await Scale.findById(scaleId);

  return scale.isReserved;
};

export {
  getAllScalesInCentre,
  getSingleScaleInCentre,
  getSingleScale,
  addScale,
  registerCentreWithScale,
  setIsReserved,
  setIsReservedBy,
  getIsReservedBy,
  checkScaleIsReserved,
};
