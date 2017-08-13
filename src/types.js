//@flow

import {Map} from 'immutable';
import type {Card, PlayableCard} from './cards/types';
import ExternalPromise from './external-promise';
import phases from './reducers/phases';

type Phase = $Keys<typeof phases>;

export type PlayCardAction = {type: 'play-card', card: PlayableCard};
export type AddActionAction = {type: 'add-action', amount: number};
export type AddBuyAction = {type: 'add-buy', amount: number};
export type AddCoinAction = {type: 'add-coin', amount: number};
export type PhaseAction = {type: 'phase', phase: Phase};
export type GainAction = {type: 'gain-card', card: Class<Card>};
export type BuyAction = {type: 'buy-card', card: Class<Card>};
export type InitPlayerAction = {type: 'init-player'};
export type InitSupplyAction = {type: 'init-supply', cards: Array<Class<Card>>};
export type WaitForActionAction = {type: 'wait-for-action', action: string, promise: ExternalPromise<Action>};
export type AskForCardAction = {type: 'ask-for-card', from: $Keys<PlayerState>, cardType: Class<Card>};
export type ChooseCardAction = {type: 'choose-card', card: Card};

export type Action =
	| PlayCardAction
	| AddActionAction
	| AddBuyAction
	| AddCoinAction
	| PhaseAction
	| GainAction
	| BuyAction
	| InitPlayerAction
	| InitSupplyAction
	| WaitForActionAction
	| AskForCardAction
	| ChooseCardAction;

export type WaitState = {
	+action?: string,
	+promise?: ExternalPromise<Action>,
};

export type TurnState = {
	+actions: number,
	+buys: number,
	+coins: number,
	+phase: Phase,
};

export type Supply = Map<Class<Card>, Array<Card>>;

export type PlayerState = {
	+deck: Array<Card>,
	+hand: Array<Card>,
	+discard: Array<Card>,
	+inPlay: Array<Card>,
};

export type State = {
	+turn: TurnState,
	+supply: Supply,
	+player: PlayerState,
	+wait: WaitState,
}

export type GetState = () => State;
export type PromiseAction = Promise<Action>;
export type ThunkAction = (dispatch: Dispatch, getState: GetState) => any;
export type Dispatch = (
	action: Action | ThunkAction | PromiseAction | Array<Action>
) => any;
