import axios from 'axios';

import { config } from '../../config';
import { InvalidConfigurationError } from '../../errors';

const elsEndpoint = config.elasticsearch.endpoint;
if (typeof elsEndpoint !== 'string' || elsEndpoint.length === 0) throw new InvalidConfigurationError('Got nullish Elasticsearch endpoint');

export const elsApi = axios.create({
	baseURL: elsEndpoint,
	auth: {
		username: config.elasticsearch.username,
		password: config.elasticsearch.password,
	},
});
