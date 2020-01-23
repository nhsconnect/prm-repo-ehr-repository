import ModelFactory from '../models';

describe('Patient - MessageFragment navigation', () => {

  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');
  const MessageFragment = ModelFactory.getByName('MessageFragment');
  const sequelize = ModelFactory.sequelize;

  afterAll(() => {
    sequelize.close();
  });

  it('should link a message fragment with a manifest', () => {

    const manifestId = {
      message_id: '03ba2531-42e3-4a70-82e6-df6fff52b226'
    };

    const fragmentId = {
      message_id: '8c0f741e-82fa-46f1-9686-23a1c08657f1'
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.findOne({ where: manifestId, transaction: t })
        .then(manifest =>
          MessageFragment.findOne({ where: fragmentId, transaction: t })
            .then(messageFragment => messageFragment.addHealthRecordManifest(manifest.get().id, { transaction: t }))
            .then(() => manifest.getMessageFragments({ transaction: t }))
        )
        .then(messageFragments => {
          expect(messageFragments.length).toBe(1);
          return expect(messageFragments[0].get().message_id).toBe(fragmentId.message_id);
        })
        .finally(() => t.rollback())
    );
  });

  it('should get multiple message fragments from manifest', () => {
    const manifestId = {
      id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc'
    };
    const messageID1 = '8c0f741e-82fa-46f1-9686-23a1c08657f1';
    const messageID2 = '5cff6bcf-98ea-4c60-8f65-4b0240324284';

    HealthRecordManifest.findOne(where(manifestId))
      .then(manifest => manifest.getMessageFragments())
      .then(messageFragments => {
        expect(messageFragments.length).toBe(2);
        expect(messageFragments[0].get().message_id).toBe(messageID1);
        return expect(messageFragments[1].get().message_id).toBe(messageID2);
      });
  });

  it('should get multiple manifests for one message fragment', () => {
    const fragmentId = {
      id: 'a1ff815c-6452-4020-ab13-9200d27a06ed'
    };
    const manifestMessageId1 = '93b699fc-03fb-438f-b5a1-ce936e0f9d4e';
    const manifestMessageId2 = 'ee6675b2-6957-46f5-8f17-363b6092092c';

    MessageFragment.findOne(where(fragmentId))
      .then(fragment => fragment.getHealthRecordManifests())
      .then(manifests => {
        expect(manifests.length).toBe(2);
        expect(manifests[0].get().message_id).toBe(manifestMessageId1);
        return expect(manifests[1].get().message_id).toBe(manifestMessageId2);
      })

  });
});

const where = body => {
  return {
    where: body
  };
};
