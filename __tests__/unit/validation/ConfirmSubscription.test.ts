import 'source-map-support/register';

import axios from 'axios';

import { confirmSubscriptionHandler } from '../../../src/handlers/ConfirmSubscription';

// Mock the axios module
jest.mock('axios');

describe('Test confirmSubscriptionHandler', () => {
	beforeAll(() => {
		const resp = { status: 200 };
		// Use this to avoid the error: Property 'mockResolvedValue' does not exist on type axios
		// Ref: https://stackoverflow.com/a/53204714
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		return mockedAxios.get.mockResolvedValue(resp);
	});

	const validEventObject = {
		message: {
			Type: 'SubscriptionConfirmation',
			SubscribeURL:
				'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
		},
	};
	const invalidEventObjects = [
		'event', // Not an object
		null,
		{
			message1: 'Sample message', // Not contains the message prop
		},
		{
			message: 'Sample message', // The message prop is not an object
		},
		{
			message: null, // The message prop is null
		},
	];

	const eventsWithInvalidMessage = [
		{
			message: {
				Type: 'Notification', // Wrong message type
				SubscribeURL:
					'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
			},
		},
		{
			message: {
				Type: '', // Empty message type
				SubscribeURL:
					'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
			},
		},
		{
			message: {
				Type: null, // Not a string
				SubscribeURL:
					'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
			},
		},
		{
			message: {
				Type: 123, // Not a string
				SubscribeURL:
					'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
			},
		},
		{
			// Missing Type prop
			message: {
				SubscribeURL:
					'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: null, // Not a string
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: 456, // Not a string
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: '', // Empty URL
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: 'http://sns.eu-central-1.@am^az|onaws', // Forbiden characters
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: 'htt://sns.eu-central-1.amazonaws.com', // Invalid protocol
			},
		},
		{
			message: {
				Type: 'SubscriptionConfirmation',
				SubscribeURL: 'sns.eu-central-1.amazonaws.com', // Invalid https protocol
			},
		},
	];

	it('Should successfully fetch the data with a valid event object', async () => {
		await expect(confirmSubscriptionHandler(validEventObject)).resolves.not.toThrow();
	});

	it('The Invalid event error should be raised for invalid event objects', async () => {
		const errorMessage = 'Invalid event';
		const resultSet = await Promise.allSettled(invalidEventObjects.map(confirmSubscriptionHandler));
		const rejectedCalls = resultSet.filter((result) => {
			if (result.status === 'fulfilled') return false;
			return String(result.reason).includes(errorMessage);
		});
		expect(rejectedCalls.length).toBe(invalidEventObjects.length);
	});

	it('The InvalidMessageError error should be raised for invalid messages', async () => {
		const errorMessage = 'Malformed SubscriptionConfirmationMessage received';
		const resultSet = await Promise.allSettled(eventsWithInvalidMessage.map(confirmSubscriptionHandler));
		const rejectedCalls = resultSet.filter((result) => {
			if (result.status === 'fulfilled') return false;
			return String(result.reason).includes(errorMessage);
		});
		expect(rejectedCalls.length).toBe(eventsWithInvalidMessage.length);
	});

	it('The InvalidAPIResponseError error should be raised for the status <> 200', async () => {
		const resp = { status: 401 };
		const mockedAxios = axios as jest.Mocked<typeof axios>;
		mockedAxios.get.mockResolvedValue(resp);

		return expect(confirmSubscriptionHandler(validEventObject)).rejects.toEqual(
			new Error(`unexpected status code ${resp.status} from GET SubscribeURL`),
		);
	});
});
