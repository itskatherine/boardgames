const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data");
const db = require("../db/connection");
const app = require("../app");
const request = require("supertest");
require("jest-sorted");

afterAll(() => db.end());

beforeEach(() => seed(testData));

describe("GET /api/categories", () => {
  test("200: Returns a list of category objects (with properties slug and description) when get request", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then((response) => {
        const { categories } = response.body;
        expect(categories.length).toBe(4);
        categories.forEach((category) => {
          expect(category).toMatchObject({
            slug: expect.any(String),
            description: expect.any(String),
          });
        });
      });
  });
  test("404: returns 404 error when given invalid endpoint", () => {
    return request(app)
      .get("/api/cadtegoriess")
      .expect(404)
      .then((response) => {
        expect(response.body.msg).toBe("Invalid url");
      });
  });
});

describe("GET /api/reviews/:review_id", () => {
  test("200: Should return review when given valid id", () => {
    return request(app)
      .get("/api/reviews/1")
      .expect(200)
      .then((response) => {
        const review = response.body.review;
        expect(review).toMatchObject({
          review_id: expect.any(Number),
          title: expect.any(String),
          review_body: expect.any(String),
          designer: expect.any(String),
          review_img_url: expect.any(String),
          votes: expect.any(Number),
          category: expect.any(String),
          owner: expect.any(String),
          created_at: expect.any(String),
        });
      });
  });
  test("404: if the id doesnt exist should return 404 and message: No review exists with that id", () => {
    return request(app)
      .get("/api/reviews/9999")
      .expect(404)
      .then((response) => {
        expect(response.body.msg).toBe("No review exists with that ID.");
      });
  });
  test("400: if the is not a number, return 400 and message: Invalid data type", () => {
    return request(app)
      .get("/api/reviews/katherine")
      .expect(400)
      .then((response) => {
        expect(response.body.msg).toBe("Invalid data type.");
      });
  });

  test("200: additional reviews count included in response (with valid id)", () => {
    return request(app)
      .get("/api/reviews/2")
      .expect(200)
      .then((response) => {
        const review = response.body.review;
        expect(review).toEqual(expect.objectContaining({ comment_count: 3 }));
      });
  });
});

describe("PATCH /api/reviews/:review_id", () => {
  const req = { inc_votes: 5 };

  test("200: When given a valid request body returns incremented/decremented vote count", () => {
    const expected = {
      review_id: 3,
      title: "Ultimate Werewolf",
      category: "social deduction",
      designer: "Akihisa Okui",
      owner: "bainesface",
      review_body: "We couldn't find the werewolf!",
      review_img_url:
        "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png",
      created_at: "2021-01-18T10:01:41.251Z",
      votes: 10,
    };
    return request(app)
      .patch("/api/reviews/3")
      .send(req)
      .expect(200)
      .then((response) => {
        expect(response.body.updatedReview).toEqual(expected);
      });
  });

  test("404: Provided with a number for an id but an review with that ID does not exist", () => {
    return request(app)
      .patch("/api/reviews/99999")
      .send(req)
      .expect(404)
      .then((response) => {
        expect(response.body.msg).toBe("No review exists with that ID.");
      });
  });

  test("400: Provided with a non number as the review id, returns an error", () => {
    return request(app)
      .patch("/api/reviews/katherine")
      .send(req)
      .expect(400)
      .then((response) => {
        expect(response.body.msg).toBe("Invalid data type.");
      });
  });

  test("400: Provided with a non number as the votes in the request body (but valid review id), returns an error", () => {
    const req = { inc_votes: "katherine" };
    return request(app)
      .patch("/api/reviews/3")
      .send(req)
      .expect(400)
      .then((response) => {
        expect(response.body.msg).toBe("Invalid data type.");
      });
  });

  test("200: Provided with a request that does not contain the inc_votes returns unchanged review object", () => {
    const req = {};
    const expected = {
      review_id: 3,
      title: "Ultimate Werewolf",
      category: "social deduction",
      designer: "Akihisa Okui",
      owner: "bainesface",
      review_body: "We couldn't find the werewolf!",
      review_img_url:
        "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png",
      created_at: "2021-01-18T10:01:41.251Z",
      votes: 5,
    };
    return request(app)
      .patch("/api/reviews/3")
      .send(req)
      .expect(200)
      .then((response) => {
        expect(response.body.updatedReview).toEqual(expected);
      });
  });
});

describe("GET /api/reviews/:review_id/comments", () => {
  test("200: Responds with an array of comments for review when given valid review id (for a review with comments)", () => {
    return request(app)
      .get("/api/reviews/2/comments")
      .expect(200)
      .then((response) => {
        const { comments } = response.body;
        expect(comments.length).toBe(3);
        comments.forEach((comment) => {
          expect(comment).toMatchObject({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            review_id: expect.any(Number),
          });
        });
      });
  });

  test("404: Valid ID datatype, but review does not exist", () => {
    return request(app)
      .get("/api/reviews/9999/comments")
      .expect(404)
      .then((response) => {
        expect(response.body.msg).toBe("No review exists with that ID.");
      });
  });

  test("400: Invalid datatype", () => {
    return request(app)
      .get("/api/reviews/katherine/comments")
      .expect(400)
      .then((response) => {
        expect(response.body.msg).toBe("Invalid data type.");
      });
  });

  test("200: Valid ID, valid datatype, but no comments exist for that review", () => {
    return request(app)
      .get("/api/reviews/1/comments")
      .expect(200)
      .then((response) => {
        expect(response.body.comments).toEqual([]);
      });
  });
});

describe("GET /api/users", () => {
  test("Returns an array of users", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then((response) => {
        const { users } = response.body;
        expect(users.length).toBe(4);
        users.forEach((user) => {
          expect(user).toMatchObject({
            username: expect.any(String),
            name: expect.any(String),
            avatar_url: expect.any(String),
          });
        });
      });
  });
});

describe("GET /api/reviews", () => {
  test("200: Returns an array of review objects, sorted by descending date order", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then((response) => {
        const { reviews } = response.body;
        expect(reviews.length).toBe(13);
        reviews.forEach((user) => {
          expect(user).toMatchObject({
            owner: expect.any(String),
            title: expect.any(String),
            review_id: expect.any(Number),
            category: expect.any(String),
            review_img_url: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            comment_count: expect.any(Number),
          });
        });
        expect(reviews).toBeSorted({ descending: true, key: "created_at" });
      });
  });
});
