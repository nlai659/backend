import express from "express";
import {
    createUser,
    retrieveAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    registerCentreToUser,
    getUserByUsername,
    checkUsernameUnique
} from '../dao/users/users-dao';

import {
    retrieveSingleCentre
} from '../dao/centres/centres-dao';
import jwt from "jsonwebtoken";
import { isAdmin, isVet } from "../middleware/authMiddleware";

const usersRouter = new express.Router();

const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_NO_CONTENT = 204;

// Retrieve a list of all users
usersRouter.get("/users", async (req, res) => {
  const users = await retrieveAllUsers();

  return res.json(users);
});

// Create a new user - signup
// ?centreId=<centreId>&userType=<userType>
usersRouter.post("/users", async (req, res) => {
  try{  
    const centreId = req.query.centreId; 
    const userType = req.query.userType;

    const userBody = req.body; 

    // check that the username doesnt already exist and if it does return 410 
    const { username, password } = userBody;

    const isUniqueUsername = await checkUsernameUnique(username);

    if (!isUniqueUsername){
      return res.status(410).send("Username not unique");
    }
  
    // check that the password is of length 7 or more if it isnt then return 409
    if (password.length < 7){
      return res.status(409).send("Password format not acceptable.");
    }

    // check that the request body has the right format, if not then return 400
    const allowedFields = ["username", "password", "email", "userType"];

    const validFields = Object.keys(userBody).filter((field) =>
      allowedFields.includes(field)
    );

    if (validFields.length === 0) {
      return res
        .status(400)
        .json({ message: "Request body not valid" });
    }

    // add reference from the user to the centre using their ids
    const centre = await retrieveSingleCentre(centreId);

    if (!centre) {
      return res.status(422).send("Incorrect centre id specified in path param.");
    }

    // check that the userType is valid 
    if (userType !== "Volunteer" && userType !== "Vet"){
      console.log("incorrect user type!")
      return res.status(400).send("Incorrect user type");
    }

    // if the params are valid then create the user and register to the specified centre 
    const newUser = await createUser(userBody);

    // if the user instance is not created correctly then return 422
    if (!newUser) {
      return res.status(422).send("Incorrect format in request payload.");
    }

    // if the centre is valid then register the user to the centre 
    await registerCentreToUser(newUser._id, centre._id);

    return res.status(HTTP_CREATED)
        .header('Location', `/users/${newUser._id}`)
        .json(newUser);   
  } catch (error){
    // likely validation of email failed in the schema
    // however could be another error too
    console.log(error);
    res.status(500).send({ message: error });
  }  
});

// Retrieve a single user by ID
usersRouter.get("/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  const user = await getUserById(userId);

  if (!user) {
    return res.status(HTTP_NOT_FOUND).send("User not found.");
  }

  return res.json(user);
});

// Update user details
usersRouter.put("/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  const updatedUser = await updateUser(userId, req.body);

  if (!updatedUser) {
    return res.status(HTTP_NOT_FOUND).send("User not found.");
  }

  return res.json(updatedUser);
});

// Delete a user by ID
usersRouter.delete("/users/:userId", async (req, res) => {
  const userId = req.params.userId;
  const deletedUser = await deleteUser(userId);

  if (!deletedUser) {
    return res.status(HTTP_NOT_FOUND).send("User not found.");
  }

  return res.status(HTTP_NO_CONTENT).send("User deleted successfully.");
});

//Authentication

usersRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserByUsername(username);

  if (user && password === user.password) {
    console.log(user.toObject());
    const accessToken = jwt.sign(
      user.toObject(),
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10h" }
    );
    return res
      .status(200)
      .json({ message: "Login successful", token: accessToken, user: user });
  } else {
    return res.status(401).json({ message: "Login failed" });
  }
});
export default usersRouter;
