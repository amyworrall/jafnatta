
//TODO players

import { applyMiddleware, combineReducers, createStore, Reducer, Store } from "redux";
import { createDynamicMiddlewares } from "redux-dynamic-middlewares";
import thunk from "redux-thunk";
import { inspectAction } from "./inspect";
import buyCard from "./middleware/buy-card";
import initPlayer from "./middleware/init-player";
import phase from "./middleware/phase";
import gainCardReducer from "./reducers/gain-card";
import { State, Action, Middleware, ThunkDispatch } from "./types";
import turn from "./reducers/turn";
import supply from "./reducers/supply";
import player from "./reducers/player";
import drawCards from "./middleware/draw-cards";
import { defaultState } from "./state";
import trashReducer from "./reducers/trash";

const dynamicMiddlewaresInstance = createDynamicMiddlewares<Middleware>()


const logActions: Middleware = store => next => action => {
	console.log(inspectAction(action));
	next(action);
};

const sliceReducers: Reducer = (state = defaultState, action) => ({
	turn: turn(state.turn, action),
	supply: supply(state, action),
	player: player(state.player, action),
	trash: state.trash
})

const compose = (...reducers: Reducer[]): Reducer => reducers.reduce(
	(composed, reducer) => (state, action) => composed(reducer(state, action), action),
	(state = defaultState, action) => state
)

const reducer = compose(
	sliceReducers,
	gainCardReducer,
	trashReducer
)

const store: Store<State, Action> & {dispatch: ThunkDispatch} = createStore(
	reducer,
	applyMiddleware(
		thunk,
		dynamicMiddlewaresInstance.enhancer,
		buyCard,
		initPlayer,
		drawCards,
		phase
	)
);

export const addInterface = (middleware: Middleware) => dynamicMiddlewaresInstance.addMiddleware(middleware)

export default store
