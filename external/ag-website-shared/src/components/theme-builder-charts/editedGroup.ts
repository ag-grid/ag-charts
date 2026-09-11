import { atom, useAtomValue, useSetAtom } from 'jotai';

/**
 * Which group of params the user is working in, for the preview to answer with.
 *
 * Most of what the editor panel themes is invisible until the chart is asked to
 * show it, which the Features popup covers for anything that can simply be left
 * switched on. A tooltip cannot: it is drawn for one datum at a time, in
 * response to a hover, so editing `tooltipBackgroundColor` changes something
 * that is not on screen and will not be until the hand on the colour picker
 * lets go and goes to find it. This lets the preview put it on screen for as
 * long as those params are being edited.
 *
 * Set by the panel to the group under the pointer or the keyboard, and cleared
 * by anything else the user turns to - including the chart itself, so that a
 * held-open tooltip never stands between the user and the preview.
 */
const editedGroupAtom = atom<string | null>(null);

export const useEditedGroup = () => useAtomValue(editedGroupAtom);

export const useSetEditedGroup = () => useSetAtom(editedGroupAtom);
