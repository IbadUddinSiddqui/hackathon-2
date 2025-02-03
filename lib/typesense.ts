import Typesense, { Client } from 'typesense';

const clientConfig = {
  nodes: [{
    host: '015dvlkq3mbheg9zp-1.a1.typesense.net',
    port: 443,
    protocol:  'https'
  }],
  apiKey: 'oXwkMkKiiaRhlhpN5K4aU8LyfJEuaDfc',
  
};

export const searchClient = new Typesense.Client({
  ...clientConfig,
  apiKey: 'CceWWxapX00O0AdPIk4y7ahVKxYEoPIG'
});

export const adminClient: Client = new Typesense.Client(clientConfig);