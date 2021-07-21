// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.

/*
chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            console.log(response);
        });
    });
});
*/

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, {method: 'getSelection'}, response => {
        console.log(response);
    });
});

