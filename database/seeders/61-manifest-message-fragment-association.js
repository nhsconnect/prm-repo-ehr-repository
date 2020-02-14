'use strict';

const tableName = 'manifests_message_fragments';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert(tableName, [
            {
                manifest_id: '948b2fad-9cf6-4fc1-8a59-dff93d4a99df',
                message_fragment_id: 'ac7ae2cb-c49d-49eb-8af7-809de45bec18',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '35bd4fd9-efcc-4d14-ba85-c3a1c33e499d',
                message_fragment_id: '11268d6f-e017-4397-b875-45e46bfded20',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '35bd4fd9-efcc-4d14-ba85-c3a1c33e499d',
                message_fragment_id: '27c68edf-b624-4013-8c5e-a5ba6b66d0bf',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '35bd4fd9-efcc-4d14-ba85-c3a1c33e499d',
                message_fragment_id: '257c6dc7-8fe1-4c14-83c2-0736bc4e0619',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '8de85168-17cd-4e29-a1dd-ebb0bd9148e9',
                message_fragment_id: '0076db22-310b-4dfb-aa2f-46f62cfa5efe',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '8de85168-17cd-4e29-a1dd-ebb0bd9148e9',
                message_fragment_id: 'b2ae3cfc-4a6a-47f0-842a-11d17ad75c05',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '8de85168-17cd-4e29-a1dd-ebb0bd9148e9',
                message_fragment_id: 'ecb31bb6-a883-4f5b-a89d-ca291209abca',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '26664240-53ea-41a8-8068-5a9e8b8fea2a',
                message_fragment_id: '06782d34-0a07-4cf0-9ae9-984c1e92c276',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '26664240-53ea-41a8-8068-5a9e8b8fea2a',
                message_fragment_id: '63cfbc2c-d949-4c49-90a7-dfea823c2c3a',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: 'df6416b9-a7e0-4c29-828e-374d9131ece0',
                message_fragment_id: '63cfbc2c-d949-4c49-90a7-dfea823c2c3a',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: 'df6416b9-a7e0-4c29-828e-374d9131ece0',
                message_fragment_id: 'cafbe945-cd48-4a9e-8810-81898b75e839',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '04c8a711-e1a7-4853-b984-5a251e99bf82',
                message_fragment_id: '28d3e466-b5b5-463c-b632-f1ae57ef209b',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '04c8a711-e1a7-4853-b984-5a251e99bf82',
                message_fragment_id: '4d03791c-1565-4cf6-be89-4afaf704321d',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '9a3e8c7e-a5a2-47ac-9da6-12e511718106',
                message_fragment_id: 'd06f1363-e8d3-4092-bc62-23b46b0722f5',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '9a3e8c7e-a5a2-47ac-9da6-12e511718106',
                message_fragment_id: '29297c90-2260-4f10-9f04-40caae4e3d43',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: 'f5ebaeb6-91d2-499e-adc7-9c73602d791a',
                message_fragment_id: '777d1123-6314-4f24-bc0c-b0310edb4f47',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: 'f5ebaeb6-91d2-499e-adc7-9c73602d791a',
                message_fragment_id: '5bfb1af4-ec8c-4a39-bb80-a154493d3faa',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '9f0e8940-1d20-4130-a5cc-8ebd8822224d',
                message_fragment_id: '5bfb1af4-ec8c-4a39-bb80-a154493d3faa',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '9f0e8940-1d20-4130-a5cc-8ebd8822224d',
                message_fragment_id: '9637758b-cb1e-482e-b4f3-74701a6bc283',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                manifest_id: '9f0e8940-1d20-4130-a5cc-8ebd8822224d',
                message_fragment_id: '675d6744-63b0-43ab-ad5e-04fa22dd94f8',
                completed_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            },
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete(tableName, null, {});
    }
};
