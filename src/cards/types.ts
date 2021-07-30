
import {State, TurnState, Dispatch, GetState} from '../types';
import { noCase } from 'no-case'
import * as util from 'util'

export class Card {
	static cardName: string
	static text: string
	static cost(_: TurnState): number { return 0 }
	constructor() {}

	static toString() {
		return this.cardName
	}

	static [util.inspect.custom]() {
		return this.cardName
	}

	[util.inspect.custom]() {
		return noCase(
			(this.constructor as typeof Card).cardName
		)
	}
}

export class PlayableCard extends Card {
	onPlay(_: Dispatch, __: GetState): void | Promise<void> {}
}

export class CoinValuedCard extends PlayableCard {
	getCoinValue(_: State): number { return 0 }
}

export class VictoryValuedCard extends Card {
	getVictoryValue(_: State): number { return 0 }
}
