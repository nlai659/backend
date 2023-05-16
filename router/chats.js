import express from "express";

import { Comment } from "../models/comment";
import { Post } from "../models/Post";
import { getUserById } from "../dao/users/users-dao";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { isAdmin, isVet, isVolunteer } from "../middleware/authMiddleware";

const chatRouter = new express.Router();

// Create a Post
chatRouter.post("/posts", isVolunteer, async (req, res) => {
  console.log(req.user, 18);

  const userId = req.user._id;

  try {
    const post = new Post(req.body);

    // add the reference to the user that created the post
    post.author = userId;

    await post.save();
    res.status(StatusCodes.CREATED).send(post);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

// Delete a Post
chatRouter.delete("/posts/:id", isVolunteer, async (req, res) => {
  const userId = req.user._id;

  console.log(userId, 36);

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    // check that the author of the post is the same as the logged in user
    if (post.author !== userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ error: ReasonPhrases.UNAUTHORIZED });
    }

    // Delete all associated comments
    await Comment.deleteMany({ post: post._id });

    // Now delete the post
    await post.remove();

    res.status(StatusCodes.OK).send(post);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
});

// Update a Post
chatRouter.patch("/posts/:id", isVolunteer, async (req, res) => {
  const userId = req.user._id;

  // update all the fields provided in the request body
  const updates = Object.keys(req.body);
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    // check that the author of the post is the same as the logged in user
    if (post.author !== userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ error: ReasonPhrases.UNAUTHORIZED });
    }

    updates.forEach((update) => (post[update] = req.body[update]));
    await post.save();
    res.status(StatusCodes.OK).send(post);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

// Get all Posts
chatRouter.get("/posts", isVolunteer, async (req, res) => {
  try {
    const posts = await Post.find({});
    res.status(StatusCodes.OK).send(posts);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
});

// Get Post by ID
chatRouter.get("/posts/:id", isVolunteer, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("comments");
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    res.status(StatusCodes.OK).send(post);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
});

// Create Comment
chatRouter.post("/posts/:postId/comments", isVolunteer, async (req, res) => {
  const userId = req.user._id;

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    const comment = new Comment({ ...req.body, post: post._id });

    // register the author with the comment
    comment.author = userId;

    // register the comment with the parent post
    post.comments.push(comment._id);
    await comment.save();
    await post.save();

    res.status(StatusCodes.CREATED).send(comment);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

// Delete Comment
chatRouter.delete(
  "/posts/:postId/comments/:commentId",
  isVolunteer,
  async (req, res) => {
    const userId = req.user._id;

    try {
      const post = await Post.findById(req.params.postId);
      if (!post) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ error: ReasonPhrases.NOT_FOUND });
      }
      const comment = await Comment.findByIdAndDelete(req.params.commentId);
      if (!comment) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .send({ error: ReasonPhrases.NOT_FOUND });
      }

      // if the logged in user isnt the owner of the post or the comment then dont let
      // them delete
      if (post.author !== userId && comment.author !== userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .send({ error: ReasonPhrases.UNAUTHORIZED });
      }

      post.comments = post.comments.filter(
        (commentId) => commentId.toString() !== req.params.commentId
      );
      await post.save();

      res.status(StatusCodes.OK).send(comment);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ error: error.message });
    }
  }
);

// Delete all comments for a specific post
chatRouter.delete("/posts/:postId/comments", isVolunteer, async (req, res) => {
  const userId = req.user._id;

  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    // check that the author of the post is the same as the logged in user
    if (post.author !== userId) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send({ error: ReasonPhrases.UNAUTHORIZED });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: post._id });

    // Clear the comments array from the post and save the updated post
    post.comments = [];
    await post.save();

    res
      .status(StatusCodes.OK)
      .send({ message: "All comments deleted for the specified post." });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
});

// Update a Comment
chatRouter.patch("/posts/:postId/comments/:commentId", isVolunteer, async (req, res) => {
  const userId = req.user._id;

  const updates = Object.keys(req.body);
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    // check that the author of the post is the same as the logged in user
    if (comment.author !== userId) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .send({ error: ReasonPhrases.UNAUTHORIZED });
    }

    updates.forEach((update) => (comment[update] = req.body[update]));
    await comment.save();
    res.status(StatusCodes.OK).send(comment);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send({ error: error.message });
  }
});

// Get all Comments for a specific Post
chatRouter.get("/posts/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("comments");
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ error: ReasonPhrases.NOT_FOUND });
    }

    res.status(StatusCodes.OK).send(post.comments);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: error.message });
  }
});

export default chatRouter;
