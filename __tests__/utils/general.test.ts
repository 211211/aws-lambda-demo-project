import 'source-map-support/register';

import { trimAndRemoveDuplicateFromArr, trimTheKeysOfMap } from '../../src/utils/general';
// test stuff
import { loadJestEnv } from '../utils/helpers';
loadJestEnv();

describe('Test utils/general', () => {
	it('Should remove all white spaces and duplicated character in given array string', () => {
		expect(trimAndRemoveDuplicateFromArr(['S', ' S', 'L', 'L'])).toEqual(['S', 'L']);
	});

	it('Should remove all white spaces and duplicated key in given object', () => {
		expect(
			trimTheKeysOfMap({
				' 27': '2021-11-22T09:39:47.334Z',
				' 28': '2021-11-22T09:39:50.665Z',
				'28': '2021-11-22T09:39:50.665Z',
			}),
		).toEqual({ '27': '2021-11-22T09:39:47.334Z', '28': '2021-11-22T09:39:50.665Z' });
	});
});
