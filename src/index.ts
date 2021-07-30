
//TODO players

import { createStore, combineReducers, applyMiddleware, Store } from 'redux';
import { Reducer, AnyAction, Dispatch } from 'redux'
import { Map, List, OrderedSet } from 'immutable';
import thunk from 'redux-thunk';
import shuffle from 'array-shuffle'
import {
	Action,
	PlayCardAction,
	AddActionAction,
	AddBuyAction,
	PhaseAction,
	AddCoinAction,
	GainAction,
	BuyAction,
	InitPlayerAction,
	InitSupplyAction,
	ChooseCardAction,
	WaitState,
	PlayerState,
	Supply,
	TurnState,
	State,
	GetState,
	Phase,
	ActionType,
	ActionArgs,
	DrawAction,
	ShuffleAction,
	MoveCardAction,
	ChooseSupplyCardAction,
	ThunkResult,
	ThunkDispatch,
	Middleware
} from './types';
import ExternalPromise from './external-promise';
import ActionCard from './cards/action'
import TreasureCard from './cards/treasure'
import VictoryCard from './cards/victory'
import playCardAction from './actions/play-card'
import phases from './reducers/phases';
import {defaultPlayerState, defaultState, defaultTurnState, defaultSupply} from './state'

import {PlayableCard, VictoryValuedCard, CoinValuedCard, Card} from './cards/types';

import * as util from 'util'
import { inspectAction } from './inspect';
import { stat } from 'fs';

import { createDynamicMiddlewares } from 'redux-dynamic-middlewares'
import { AssertionError } from 'assert';

const dynamicMiddlewaresInstance = createDynamicMiddlewares<Middleware>()


export const addActionAction = (amount: number): AddActionAction => ({
	type: 'add-action',
	amount,
});

export const addBuyAction = (amount: number): AddBuyAction => ({
	type: 'add-buy',
	amount,
});

export const addCoinAction = (amount: number): AddCoinAction => ({
	type: 'add-coin',
	amount,
});

export const phaseAction = (phase: Phase): PhaseAction => ({
	type: 'phase',
	phase,
});

export const gainAction = ({card, where = 'discard'}: ActionArgs<GainAction>): GainAction => ({
	type: 'gain-card',
	card,
	where
});

export const buyAction = (card: typeof Card): BuyAction => ({
	type: 'buy-card',
	card,
});

export const drawAction = (amount: number): DrawAction => ({
	type: 'draw',
	amount
})

export const initPlayerAction = (): InitPlayerAction => ({
	type: 'init-player',
});

export const initSupplyAction = (
	cards: Array<typeof Card>
): InitSupplyAction => ({ type: 'init-supply', cards });

type ActionFromType<T extends ActionType> = Extract<Action, {type: T}>

export const waitForActionAction = <T extends ActionType>(action: T): ThunkResult<Promise<ActionFromType<T>>> => (
	dispatch: ThunkDispatch,
	getState
) => {
	const promise: ExternalPromise<ActionFromType<T>> = ExternalPromise.create();
	dispatch({ type: 'wait-for-action', action, promise });
	return promise;
};

export const askForCardAction = (
	from: keyof PlayerState,
	cardType: typeof Card
): ThunkResult<Promise<ChooseCardAction>> => async (dispatch: ThunkDispatch, getState) => {
	dispatch({ type: 'ask-for-card', from, cardType });
	return dispatch(waitForActionAction('choose-card'));
};

export const askForSupplyCardAction = (maxValue: number): ThunkResult<Promise<ChooseSupplyCardAction>> => async (dispatch: ThunkDispatch, getState) => {
	dispatch({ type: 'ask-for-supply-card', maxValue });
	return dispatch(waitForActionAction('choose-supply-card'));
};

export const chooseCardAction = (card: Card): ChooseCardAction => ({
	type: 'choose-card',
	card,
});

export const chooseSupplyCardAction = (cardType: typeof Card): ChooseSupplyCardAction => ({
	type: 'choose-supply-card',
	cardType,
});


export const moveCardAction = ({card, from, to}: ActionArgs<MoveCardAction>): MoveCardAction => ({
	type: 'move-card',
	card, from, to
})

export const shuffleAction = (): ShuffleAction => ({type: 'shuffle'})

export class Silver extends TreasureCard {
	static cardName = 'Silver';
	static cost = () => 3;

	getCoinValue() {
		return 2;
	}
}

export class Copper extends TreasureCard {
	static cardName = 'Copper';
	static cost = () => 0;

	getCoinValue() {
		return 1;
	}
}

export class Estate extends VictoryCard {
	static cardName = 'Estate';
	static cost = () => 2;

	getVictoryValue() {
		return 2;
	}
}

export class Woodcutter extends ActionCard {
	static cardName = 'Woodcutter';
	static text = `
		+1 Buy
		+$2
	`;
	static cost = () => 3;

	onPlay(dispatch: ThunkDispatch) {
		dispatch(addBuyAction(1));
		dispatch(addCoinAction(2));
	}
}

export class ThroneRoom extends ActionCard {
	static cardName = 'Throne Room';
	static text = `
		You may play an Action card from your hand twice.
	`;
	static cost = () => 4;

	async onPlay(dispatch: ThunkDispatch) {
		const { card } = await dispatch(
			askForCardAction('hand', ActionCard)
		);

		if(card) {
			if(!(card instanceof ActionCard)) throw new AssertionError({
				message: 'Should have returned an ActionCard',
				expected: ActionCard,
				actual: card.constructor
			})

			await dispatch(playCardAction(card, {fromCard: true}));
			await dispatch(playCardAction(card, {fromCard: true}));
		}
	}
}

function commonTurnReduce(
	state: TurnState = defaultTurnState,
	action: Action
): TurnState {
	switch (action.type) {
		case 'add-coin':
			return { ...state, coins: state.coins + action.amount };
		default:
			return state;
	}
}

const phaseReduce = (
	state: TurnState = defaultTurnState,
	action: Action
): TurnState => phases[state.phase](state, action);

const turn = (state: TurnState, action: Action) => commonTurnReduce(phaseReduce(state, action), action);

const logActions: Middleware = store => next => action => {
	console.log(inspectAction(action));
	next(action);
};

const buyCard: Middleware = store => next => (action: Action) => {
	switch (action.type) {
		case 'buy-card':
			const { phase, buys } = store.getState().turn;
			if (phase === 'buy' && buys >= 1) {
				// let the phase reducer handle turn state changes before gaining
				const val = next(action);
				store.dispatch(gainAction({ card: action.card }));
				return val;
			}
			break;
		default:
			return next(action);
	}
};

const initPlayer: Middleware = store => next => action => {
	switch(action.type) {
		case 'init-player':
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Copper }))
			store.dispatch(gainAction({ card: Estate }))
			store.dispatch(gainAction({ card: Estate }))
			store.dispatch(gainAction({ card: Estate }))
			break;
		default:
			return next(action);
	}
}

const draw: Middleware = store => next => action => {
	switch (action.type) {
		case 'draw':
			for(let i = 0; i < action.amount; i++) {
				if(store.getState().player.deck.size === 0) {
					store.dispatch(shuffleAction())
				}

				store.dispatch(moveCardAction({
					card: store.getState().player.deck.first(),
					from: 'deck',
					to: 'hand'
				}))

			}
		default:
			next(action);
	}
}

const phase: Middleware = store => next => async (action: Action) => {
	switch(action.type) {
		case 'phase':
			// run the action so reducer changes phase
			const val = next(action);

			switch(action.phase) {
				case 'action': {
					do {
						const { card } = await store.dispatch(askForCardAction('hand', ActionCard))

						if(card instanceof ActionCard) {
							await store.dispatch(playCardAction(card))
						} else {
							break
						}
					} while(store.getState().turn.actions > 0)

					store.dispatch(phaseAction('buy'))
					break;
				}
				case 'buy': {
					while(true) {
						const { card } = await store.dispatch(askForCardAction('hand', TreasureCard))

						if(card instanceof TreasureCard) {
							await store.dispatch(playCardAction(card))
						} else {
							break
						}
					}

					while(store.getState().turn.buys > 0) {
						const { cardType } = await store.dispatch(askForSupplyCardAction(store.getState().turn.coins))
						const { turn } = store.getState()

						if(store.getState().supply.has(cardType)) {
							if(cardType.cost(turn) <= turn.coins) {
								store.dispatch(buyAction(cardType))
							}
						} else {
							break
						}
					}

					store.dispatch(phaseAction('cleanup'))

					break;
				}
				case 'cleanup': {
					while(store.getState().player.inPlay.size) {
						store.dispatch(moveCardAction({
							card: store.getState().player.inPlay.first(),
							from: 'inPlay',
							to: 'discard'
						}))
					}
					while(store.getState().player.hand.size) {
						store.dispatch(moveCardAction({
							card: store.getState().player.hand.first(),
							from: 'hand',
							to: 'discard'
						}))
					}
					store.dispatch(drawAction(5))
					store.dispatch(phaseAction('action'))
					break;
				}
			}

			return val
		default:
			next(action)
	}
}

function gainCardReducer(state: State = defaultState, action: Action): State {
	switch (action.type) {
		case 'gain-card':
			const [card, ...remaining] = state.supply.get(action.card);
			return {
				...state,
				player: {
					...state.player,
					[action.where]: state.player[action.where].concat([card]),
				},
				supply: state.supply.set(action.card, remaining),
			};
		default:
			return state;
	}
}

const repeat = <T>(length: number, f: () => T): Array<T> => Array.from({ length }, f);

function supply(state: Supply = defaultSupply, action: Action): Supply {
	switch (action.type) {
		case 'init-supply':
			return action.cards.reduce(
				(supply, card) => supply.set(card, repeat(10, () => new card())),
				state
			);
		default:
			return state;
	}
}

function player(
	state: PlayerState = defaultPlayerState,
	action: Action
): PlayerState {
	switch (action.type) {
		case 'shuffle':
			return {
				...state,
				deck: OrderedSet(shuffle(state.discard.toArray())),
				discard: OrderedSet()
			}
		case 'move-card':
			return {
				...state,
				[action.from]: state[action.from].delete(action.card),
				[action.to]: state[action.to].add(action.card)
			}
		default:
			return state;
	}
}

function wait(state: WaitState = {}, action: Action): WaitState {
	switch (action.type) {
		case 'wait-for-action':
			return {
				...state,
				action: action.action,
				promise: action.promise,
			};
		case state.action:
			if (state.promise) {
				state.promise.resolve(action);
			}

			return {};
		default:
			return state;
	}
}

const sliceReducers = combineReducers({ turn, supply, player, wait })

const reducer: Reducer = (state, action) => gainCardReducer(sliceReducers(state, action), action)

const store: Store<State, Action> & {dispatch: ThunkDispatch} = createStore(
	reducer,
	applyMiddleware(
		thunk,
		dynamicMiddlewaresInstance.enhancer,
		buyCard,
		initPlayer,
		draw,
		phase
	)
);

export const addInterface = (middleware: Middleware) => dynamicMiddlewaresInstance.addMiddleware(middleware)

export default store
