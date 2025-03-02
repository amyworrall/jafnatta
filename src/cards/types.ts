
import {State, TurnState, Dispatch, GetState} from '../types';
import { noCase } from 'no-case'
import * as util from 'util'

// TODO cards with multiple types

export class Card {
	static cardName: string
	static text: string
	static cost(_: TurnState): number { return 0 }
	static numberInSupply(_: State): number { return 10 }

	constructor() {}

	static toString() {
		return this.cardName || this.name
	}

	static friendlyName() {
		return noCase(this.toString())
	}

	toString() {
		return (this.constructor as typeof Card).friendlyName()
	}

	static [util.inspect.custom]() {
		return this.toString()
	}

	[util.inspect.custom]() {
		return this.toString()
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
