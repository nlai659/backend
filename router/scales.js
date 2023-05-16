import express from "express";
import {
  getSingleScaleInCentre,
  getAllScalesInCentre,
  registerCentreWithScale,
  addScale,
  setIsReserved,
  setIsReservedBy,
  getIsReservedBy,
  checkScaleIsReserved,
} from "../dao/scales/scales-dao";
import {
  setIsBeingWeighed,
  retrieveTimestampDog,
  getLatestDogWeight,
  registerWeightToDog,
} from "../dao/dogs/dogs-dao";
import { registerScaleWithCentre } from "../dao/centres/centres-dao";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { isVolunteer } from "../middleware/authMiddleware";

const TIMEOUT_DURATION = 30000;

const scalesRouter = new express.Router();

// endpoint 1: retrieve all scales using centreId
scalesRouter.get("/centres/:centreId/scales", async (req, res) => {
  const centreId = req.params.centreId;
  const scales = await getAllScalesInCentre(centreId);

  console.log(scales);

  if (!scales || scales === null) {
    return res.status(StatusCodes.NOT_FOUND).send(ReasonPhrases.NOT_FOUND);
  }
  return res.status(StatusCodes.OK).json(scales);
});

// endpoint 2: retrieve a single scale using scale id and centre id
scalesRouter.get("/centres/:centreId/scales/:scaleId", async (req, res) => {
  const centreId = req.params.centreId;
  const scaleId = req.params.scaleId;
  const scale = await getSingleScaleInCentre(centreId, scaleId);

  if (!scale) {
    return res.status(StatusCodes.NOT_FOUND).send(ReasonPhrases.NOT_FOUND);
  }
  return res.status(StatusCodes.OK).send(scale);
});

// endpoint 3: Add a new scale
scalesRouter.post("/centres/:centreId/scales", async (req, res) => {
  const centreId = req.params.centreId;
  const scale = req.body;

  try {
    // create the account
    const newScale = await addScale(scale);

    // register the centre with the scale
    const updatedScale = await registerCentreWithScale(newScale._id, centreId);

    // register the scale with the centre
    await registerScaleWithCentre(newScale._id, centreId);

    return res
      .status(StatusCodes.CREATED)
      .header("Location", `/home/details/scale/${updatedScale._id}`)
      .json(updatedScale);
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(ReasonPhrases.INTERNAL_SERVER_ERROR);
  }
});

// endpoint 4: Reserve a dog and a scale
scalesRouter.get("/scales/:scaleId/dog/:dogId/reserve", async (req, res) => {
  const scaleId = req.params.scaleId;
  const dogId = req.params.dogId;

  console.log("scale id" + scaleId);
  console.log("dog id: " + dogId);

  try {
    // change the scale isReserved field to true
    await setIsReserved(scaleId, true);
    // change the dog isBeingWeighed field to true
    await setIsBeingWeighed(dogId, true);
    // update the isReservedBy field for the scale to the dogs id
    const scale = await setIsReservedBy(dogId, scaleId);
    console.log("scale after being reserved by a dog: " + scale, 94);

    // get the current time in the same format
    const startTime = new Date(Date.now());
    console.log("line 96");

    // start timeout for 60 seconds before checking the dog weight
    const checkIfWeightIsRegistered = async () => {
      console.log("line 100");
      
      console.log("line 107");
      // check the time stamp of the last index in the weights array
      const endTimeString = await retrieveTimestampDog(dogId);
      const endTime = new Date(endTimeString);
      
      console.log("line 110");

      // if the dog has no weight recorded at all then endtime will be null
      if (!endTime){
        // reset the reserve variables
        await setIsReserved(scaleId, false);
        await setIsBeingWeighed(dogId, false);
        await setIsReservedBy(null, scaleId);

        const message = {
          message: "Weight not successfully registered. The dog has no prior weight in db",
          status: false,
          weight: null
        };

        return res.status(StatusCodes.BAD_REQUEST).send(message);
      }
      // if the last time stamp is 120s ago or less than the timestamp for when we began weighing
      // then the dog weight was added succesfully
      const seconds = (endTime.getTime() - startTime.getTime()) / 1000;
      
      console.log("start time normal", startTime, 135)
      console.log("end time normal", endTime, 136)
      console.log("start time: ", startTime.getTime(), 137);
      console.log("end time: ", endTime.getTime(), 138);
      console.log("seconds: ", seconds, 139);
      console.log("time out in seconds: ", TIMEOUT_DURATION / 1000, 140)

      if (seconds > (TIMEOUT_DURATION / 1000) || seconds <= 0) {
        // reset the reserve variables
        await setIsReserved(scaleId, false);
        await setIsBeingWeighed(dogId, false);
        await setIsReservedBy(null, scaleId);

        const message = {
          message: "Weight not successfully registered. The previous weight is too long ago.",
          status: false,
          weight: null
        };

        return res.status(StatusCodes.BAD_REQUEST).send(message);
      }

      // weight is successfully registered and in time
      const latestWeight = await getLatestDogWeight(dogId);

      // reset the reserve variables
      await setIsReserved(scaleId, false);
      await setIsBeingWeighed(dogId, false);
      await setIsReservedBy(null, scaleId);

      // check that the weight value received is valid (done inside the other endpoint that gets the weight from the microcontroller)
      // return the weight to the client mobile app and the success status
      const message = {
        message: "Weight successfully recorded",
        status: true,
        weight: latestWeight.weight,
      };

      return res.status(StatusCodes.OK).send(message);
    };

    setTimeout(checkIfWeightIsRegistered, TIMEOUT_DURATION);
  } catch (error) {
    // reset the reserve variables
    await setIsReserved(scaleId, false);
    await setIsBeingWeighed(dogId, false);
    await setIsReservedBy(null, scaleId);
    console.log("ERROR ---- " + error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(ReasonPhrases.INTERNAL_SERVER_ERROR);
  }
});

// endpoint 5: Get the weight of the dog and record it in the database from the microcontroller
//?scaleId=<scaleId>&weight=<weight>
scalesRouter.get("/scales/measure", async (req, res) => {
  const weight = +req.query.weight;
  const scaleId = req.query.scaleId;

  // check that the scale is currently reserved
  const isReserved = await checkScaleIsReserved(scaleId);

  console.log("isReserved: ", isReserved, 191)

  if (!isReserved) {
    const message = {
      message: "this scale is not reserved by a dog",
      status: false,
    };

    return res.status(StatusCodes.CONFLICT).send(message);
  }

  // check that the dog weight is valid
  if (isNaN(weight) || weight <= 0) {
    const message = {
      message: "Dog weight invalid",
      status: false,
    };

    return res.status(StatusCodes.BAD_REQUEST).send(message);
  }
  // check which dog is being on that scale
  const dogId = await getIsReservedBy(scaleId);
  console.log("getIsReservedBy: ", dogId, 213);

  // add to their weights array and update the latest weight
  const dogWeights = await registerWeightToDog(dogId, weight);
  console.log("dog weights: ", dogWeights, 218);

  const message ={
    message: "Dog weight recorded successfully.",
    status: true,
  }

  return res.status(StatusCodes.ACCEPTED).send(message);
});

export default scalesRouter;
