const request = require('supertest');
const express = require('express');

jest.mock('pg');
const {Pool, Client} = require('pg');
const query = jest.fn();
Pool.mockImplementation(() => ({
  query,
}));

const Audit = require('./Audit');
const {auditMiddleware} = require('./Audit');

describe('Audit', () => {
  let app;
  beforeEach(() => {
    query.mockReturnValue(true);
    app = express();
    app.use(express.json());
    app.use(auditMiddleware);
    app.use('/auth/login', async (req, res, next) => {
      console.log('login success');
      res.status(200).send({
        user: {
          id: 555,
          email: '555@ww.com',
        },
      });
    });
    app.use('/api/admin/api/admin/api/trees/20866', async (req, res, next) => {
      //mock to inject user in middleware
      req.user = {
        id: 555,
        email: '555@qq.com',
      };
      console.log('verify success');
      res.status(201).send({});
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      const res = await request(app).get('/auth/login');
      expect(res.statusCode).toBe(200);
    });

    it('login', () => {
      //-- Auto-generated SQL script #202006191553
      //INSERT INTO public.audit ("operator",platform,ip,browser,organization,operation)
      //  VALUES (1,'admin_panel','127.0.0.1','chrome','greenstand','{
      //    "type": "login"
      //    }');
      //
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /insert\s+into.*audit.*admin_user_id.*555.*(127.0.0.1).*(node-superagent).*login.*/i,
        ),
      );
    });
  });

  describe('Tree verify', () => {
    beforeEach(async () => {
      const res = await request(app)
        .patch('/api/admin/api/admin/api/trees/20866')
        .send({
          active: true,
          age: 'new_tree',
          approved: true,
          captureApprovalTag: 'simple_lead',
          id: 20866,
          morphology: 'seedling',
        });
      expect(res.statusCode).toBe(201);
    });

    it('verify', () => {
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /insert\s+into.*audit.*555.*tree_verify.*20866.*seedling.*/i,
        ),
      );
    });
  });
});
