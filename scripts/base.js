"use strict";
const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}