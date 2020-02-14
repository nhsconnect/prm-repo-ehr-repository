'use strict';

const tableName = 'health_record_manifests';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert(tableName, [
            {
                id: '948b2fad-9cf6-4fc1-8a59-dff93d4a99df',
                message_id: '1951c57f-3799-4591-87ba-f07df65f2b72',
                health_record_id: 'cb3d2ad3-3cdb-45fa-94bd-0e5779166c8b',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '35bd4fd9-efcc-4d14-ba85-c3a1c33e499d',
                message_id: '00201197-0685-4dcb-a2a6-5c8b92d3c085',
                health_record_id: 'a717d32e-fe34-42c5-a564-9d6b3049b624',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '8de85168-17cd-4e29-a1dd-ebb0bd9148e9',
                message_id: 'd1809679-7e5e-4bb8-8c99-0d726fb89bc7',
                health_record_id: 'deeb8288-df5f-4197-a5b9-743992f4d10f',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '26664240-53ea-41a8-8068-5a9e8b8fea2a',
                message_id: '6e4e8902-35db-4217-b5d5-e477be39d796',
                health_record_id: '5dc9d99c-c018-46d3-bba2-49bc4489e529',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'df6416b9-a7e0-4c29-828e-374d9131ece0',
                message_id: 'ac9f15cf-be1f-499f-b268-1ce5c2d16003',
                health_record_id: '5dc9d99c-c018-46d3-bba2-49bc4489e529',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '04c8a711-e1a7-4853-b984-5a251e99bf82',
                message_id: '1a686f08-9809-48d7-b9f9-1d96ec144f00',
                health_record_id: '08850511-50c8-436e-b12c-5c452758c4ec',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '9a3e8c7e-a5a2-47ac-9da6-12e511718106',
                message_id: 'bc716b03-82bd-4dd7-a3c5-a7749d5d6d40',
                health_record_id: '08850511-50c8-436e-b12c-5c452758c4ec',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 'f5ebaeb6-91d2-499e-adc7-9c73602d791a',
                message_id: '94ed10bf-fc82-42ea-b738-dfaa54ee468c',
                health_record_id: '4aa3f0fa-197d-4af3-b64f-4a125cbefeb0',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '9f0e8940-1d20-4130-a5cc-8ebd8822224d',
                message_id: '2440f648-7995-49ee-967a-86b33706234e',
                health_record_id: '4aa3f0fa-197d-4af3-b64f-4a125cbefeb0',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete(tableName, null, {});
    }
};
