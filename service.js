'use strict';

const ApiGateway = require('moleculer-web');
const DbMixin = require('./mixins/db.mixin');
const faker = require('faker');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'tasks',
  version: 1,
  mixins: [ApiGateway, DbMixin('tasks')],

  settings: {
    port: process.env.PORT || 3000,
    ip: '0.0.0.0',
    fields: ['id', 'description', 'state', 'user_id'],

    entityValidator: {
      id: 'string',
      description: 'string',
      state: 'string',
      user_id: 'string',
    },
  },

  dependencies: [],

  actions: {
    /**
     * The "moleculer-db" mixin registers the following actions:
     *  - list
     *  - find
     *  - count
     *  - create
     *  - insert
     *  - update
     *  - remove
     */
  },

  events: {},

  methods: {
    async seedDB() {
      try {
        this.logger.info('Seed Tasks collection...');
        await this.waitForServices(['users.list']);

        const users = await this.broker.call('users.list');

        const usersIds = users.map((u) => u.id || u._id);

        debugger;

        if (!usersIds.length) {
          this.logger.info('Waiting for `users` seed...');
          setTimeout(this.seedDB, 1000);

          return;
        }

        const tasks = new Array(30).fill({}).map(() => ({
          id: faker.random.uuid,
          description: faker.hacker.phrase,
          state: faker.random.arrayElement(['TO_DO', 'DONE']),
          user_id: faker.random.arrayElement(usersIds),
        }));

        await this.adapter.insertMany(tasks);

        this.logger.info(`Generated ${tasks.length} tasks!`);

        return this.clearCache();
      } catch (error) {
        if (error.name === 'ServiceNotFoundError') {
          this.logger.info('Waiting for `users` service...');
          setTimeout(this.seedDB, 1000);

          return;
        } else throw error;
      }
    },
  },

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  async started() {},

  /**
   * Service stopped lifecycle event handler
   */
  async stopped() {},
};
