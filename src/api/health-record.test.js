import request from "supertest";
import app from "../app";
import { persistHealthRecord } from "../services/database";
import { getSignedUrl } from "../services/storage";
import ModelFactory from "../models";

jest.requireActual("../middleware/logging");

jest.mock("express-winston", () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));
jest.mock("../config/logging");

jest.mock("../services/database/persist-health-record", () => ({
  persistHealthRecord: jest.fn().mockReturnValue(Promise.resolve("Persisted"))
}));

jest.mock("../services/storage/get-signed-url", () =>
  jest.fn().mockReturnValue(Promise.resolve("some-url"))
);

describe("health-record", () => {

  const nhsNumber = "test-nhs-number";
  const conversationId = "test-conversation-id";
  const messageId = "test-message-id";

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe("POST /health-record/{conversationId}/message", () => {

    const TEST_ENDPOINT = `/health-record/${conversationId}/message`;

    it("should return 201", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(201)
        .end(done);
    });

    it("should call getSignedUrl service with request body", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(() => {
          expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
        })
        .end(done);
    });

    it("should return URL from s3 service", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(res => {
          expect(res.text).toEqual("some-url");
        })
        .end(done);
    });

    it("should return 422 if no messageId is provided in request body", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect("Content-Type", /json/)
        .expect(res => {
          expect(res.body).toEqual({ errors: [{ messageId: "Invalid value" }] });
        })
        .end(done);
    });
  });

  describe("POST /health-record/{conversationId}/new/message", () => {

    const TEST_ENDPOINT = `/health-record/${conversationId}/new/message`;

    it("should return 201", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(201)
        .end(done);
    });

    it("should call persistHealthRecord with information provided", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(() => {
          expect(persistHealthRecord).toHaveBeenCalledTimes(1);
          expect(persistHealthRecord).toHaveBeenCalledWith(nhsNumber, conversationId, messageId, null);
        })
        .end(done);
    });

    it("should call persistHealthRecord with information provided including manifest", done => {
      const manifest = ['item-1', 'item-2'];
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId,
          manifest
        })
        .expect(() => {
          expect(persistHealthRecord).toHaveBeenCalledTimes(1);
          expect(persistHealthRecord).toHaveBeenCalledWith(nhsNumber, conversationId, messageId, manifest);
        })
        .end(done);
    });

    it("should call getSignedUrl service with request body", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(() => {
          expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
        })
        .end(done);
    });

    it("should return URL from s3 service", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(res => {
          expect(res.text).toEqual("some-url");
        })
        .end(done);
    });

    it("should return 422 if no messageId is provided in request body", done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect("Content-Type", /json/)
        .expect(res => {
          expect(res.body).toEqual({ errors: [{ nhsNumber: "Invalid value" }, { messageId: "Invalid value" }] });
        })
        .end(done);
    });
  });

  describe("PUT /health-record/{conversationId}/message/{messageId}", () => {

    const TEST_ENDPOINT = `/health-record/${conversationId}/message/${messageId}`;

    it("should return 204", done => {
      request(app)
        .put(TEST_ENDPOINT)
        .send({
          transferComplete: true
        })
        .expect(204)
        .end(done);
    });

    it("should return 422 if transferComplete is not provided in body", done => {
      request(app)
        .put(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect(res => {
          expect(res.body).toEqual({ errors: [{ transferComplete: "Invalid value" }] });
        })
        .end(done);
    });
  });
});