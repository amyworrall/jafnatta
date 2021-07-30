import j, {
	Woodcutter,
	Silver,
	Copper,
	initPlayerAction,
	initSupplyAction,
	buyAction,
	addCoinAction,
	phaseAction,
	askForCardAction,
	chooseCardAction,
	Estate,
	addInterface,
	gainAction,
	chooseSupplyCardAction,
	askForSupplyCardAction,
	drawAction
} from './';
import playCardAction from './actions/play-card'
import ActionCard from './cards/action'

import { inspectState } from './inspect';

import prompt from 'prompts'
import { Card } from './cards/types';
import { Action, AskForCardAction } from './types';
import TreasureCard from './cards/treasure';

const tick = () => new Promise(resolve => process.nextTick(resolve))

addInterface(store => next => async (action: Action) => {
	const state = store.getState()
	switch(action.type) {
		case 'ask-for-card': {
			const cards = state.player[action.from].filter(card => card instanceof action.cardType)

			await tick()

			if(cards.length > 0) {
				const { card }: { card: Card } = await prompt({
					type: 'select',
					name: 'card',
					message: 'pick a card',
					choices: cards.map((card, i) => ({
						title: card.toString(),
						value: card
					})).concat({
						title: 'nothing',
						value: undefined
					})
				})

				store.dispatch(chooseCardAction(card))
			} else {
				store.dispatch(chooseCardAction(undefined))
			}

			break;
		}
		case 'ask-for-supply-card': {
			const cardTypes = state.supply.keySeq().toArray()

			await tick()

			const { cardType }: { cardType: typeof Card } = await prompt({
				type: 'select',
				name: 'cardType',
				message: 'pick a card',
				choices: cardTypes.map((type, i) => ({
					title: type.toString(),
					value: type
				})).concat({
					title: 'nothing',
					value: undefined
				})
			})

			store.dispatch(chooseSupplyCardAction(cardType))
			break;
		}
		default:
			next(action)
	}
})

async function main() {
	j.subscribe(() => console.log(
		inspectState(j.getState()) + '\n'
		+ '═'.repeat(process.stdout.columns) + '\n'
	));

	j.dispatch(initSupplyAction([
		Copper,
		Estate,
		Woodcutter
	]))

	j.dispatch(initPlayerAction())
	j.dispatch(drawAction(5))
	j.dispatch(phaseAction('action'))
}

main()
