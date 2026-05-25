# Zotero Hover Preview

A lightweight Obsidian plugin that shows a **floating PDF preview popup** when hovering `zotero://` links inside markdown notes.

## Features

* Hover `zotero://open-pdf/...` links to preview PDFs
  * Examples:
```
[zotero link](zotero://open-pdf/library/items/MXSKPH4C?page=5)
[zotero annotation](zotero://open-pdf/library/items/MXSKPH4C?page=2&annotation=7RNCMHTX)
zotero://open-pdf/library/items/MXSKPH4C?page=10
```
* Works in:
  * Reading View
  * Live Preview
  * Source Mode
  
* Interactive controls:

  * `Ctrl + scroll`: zoom
  * drag on zoom: pan
  * scroll down / up: next / previous page
  * drag header: pin popup
  
* Dark mode PDF rendering
* Auto-detects Zotero storage folders
* Configurable:  
  * popup width
  * hover delay
  * custom Zotero storage path

## Usage

* Hover any supported `zotero://` link
* Click the PDF canvas to open the document in Zotero
* Drag the header to pin the popup

## Settings

* `Zotero storage path`
  * Custom storage directory - use this if plugin cannot guess your storage folder
	* The custom path will not break the storage guesser on other platforms, so plugin should work on multiple platforms at the same time even if you set custom path
* `Popup width`
  * Controls popup size
* `Hover delay`

  * Delay before preview appears