import 'source-map-support/register';

import { isRight } from 'fp-ts/Either';

import { parseIncomingMessageHandler } from '../../../src/handlers/ParseIncomingMessage';
import { plNotification } from '../../../src/validation/IncomingMessages';

const unknownMessageResult = {
	next: 'ERROR',
	message: 'UNKNOWN MESSAGE',
};

const validSubscriptionConfirmEvent = {
	Type: 'SubscriptionConfirmation',
	SubscribeURL:
		'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-central-1:037408918343:notification-article&Token=2336412f37fb687f5d51e6e2425e90ccf48778401cc072fe61d28eced01bd8a5b703c00b93523a22b5c8335b00c7b533bbc651c4b87e644e86a9b9a5a95c72459660dd4693db7e012d972af318135e6ba827a984856e6dfd8e090edea0c79deafc3db41606bd7a13188da0ad06ff8dc3ab30ce3236b9cb9c9b5e388b236a5ffe',
};

const validNotificationEvent = {
	Type: 'Notification',
	MessageId: '5626515e-6695-5f30-8eb9-0877c45357d9',
	TopicArn: 'arn:aws:sns:eu-central-1:037408918343:notification-article',
	Message: '{"gtin": "4047225027944", "channel": "gkkCilGkkSapForward", "action": "Article create"}',
	Timestamp: '2021-05-27T13:37:10.524Z',
	SignatureVersion: '1',
	Signature:
		'Yat65mwoYhHu2XvMWLiQtn1T8qi9WyuHE3yVRD20lnngbK9bNr+dHI2Nbwrjt2kr3R44FSQPc24B1jmA172GmxM1H+TIhka8owyU6YIXOJLHM7YBK720Kl59dhihMHo4re9gz+RUm+VmmRNw2LkAromKjqLjytcFkOvRjGjMTD46LWaTRPoC+qHx5LLHKFclhf6FUeFXHIN/Kxvu6SGTuURWTWS93GrUSsM64Jg35BkBQT0+CsZg2FzVepkCV6SOp1tVWrTUcUJmz8auKeJrTsFu/T269lLsqJ+P04P0MAHq9act9kFJNfds95zErqo+BbELHHZcStksyOMOMTA63w==',
	SigningCertURL: 'https://sns.eu-central-1.amazonaws.com/SimpleNotificationService-010a507c1833636cd94bdb98bd93083a.pem',
	UnsubscribeURL:
		'https://sns.eu-central-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-central-1:037408918343:notification-article:4ea17d74-9226-44e9-bf8d-797e82a56b8d',
};

describe('Test parseIncomingMessageHandler', () => {
	it('The ERROR result should be returned for the empty event objects', () => {
		[null, undefined, {}].map(async (event) => {
			const parsingResult = await parseIncomingMessageHandler(event);
			expect(parsingResult).toStrictEqual(unknownMessageResult);
		});
	});

	it('Valid subscription confirm message should be parsed', async () => {
		const confirmSubscriptionResult = {
			next: 'ConfirmSubscription',
			message: null,
		};

		const parsingResult = await parseIncomingMessageHandler(validSubscriptionConfirmEvent);
		expect(parsingResult).toStrictEqual({ ...confirmSubscriptionResult, message: validSubscriptionConfirmEvent });
	});

	it('Valid notification message should be parsed', async () => {
		const parsingResult = await parseIncomingMessageHandler(validNotificationEvent);
		const validatedPLNotification = plNotification.decode(validNotificationEvent);
		expect(isRight(validatedPLNotification)).toBeTruthy();

		// The below condition should always be true
		if (isRight(validatedPLNotification)) {
			const updateArticleResult = {
				next: 'FetchArticle',
				message: validatedPLNotification.right.Message,
			};
			// The right prop only available after we check the validation result with isRight() method
			expect(parsingResult).toStrictEqual(updateArticleResult);
		}
	});
});
