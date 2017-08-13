import j, {
	ActionCard,
	inspectState,
	Woodcutter,
	Silver,
	Copper,
	initPlayerAction,
	initSupplyAction,
	buyAction,
	addCoinAction,
	phaseAction,
	playCardAction,
	askForCardAction,
} from './';

j.subscribe(() => console.log(inspectState(j.getState())));
j.dispatch(askForCardAction('hand', ActionCard)).then(console.log.bind(console, 'card from hand'));
j.dispatch(addCoinAction(5));
