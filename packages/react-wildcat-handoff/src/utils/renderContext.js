"use strict";

const React = require("react");
const ReactDOM = require("react-dom/server");
const Helmet = require("react-helmet");
const Router = require("react-router");
const defaultTemplate = require("./defaultTemplate.js");

const radium = require("react-wildcat-radium");
const matchMediaMock = require("match-media-mock").create();

const getClientSize = require("./clientSize.js").getClientSize;

const RoutingContext = Router.RoutingContext;
const match = Router.match;

radium.setMatchMedia(matchMediaMock);

module.exports = function renderContext(cfg) {
    const cookies = cfg.cookies;
    const request = cfg.request;
    const wildcatConfig = cfg.wildcatConfig;

    return new Promise(resolve => {
        match(cfg, (error, redirectLocation, renderProps) => {
            let result = {};

            if (redirectLocation) {
                result = {
                    redirect: true,
                    redirectLocation,
                    status: 301
                };
            } else if (error) {
                result = {
                    error,
                    status: 500
                };
            } else if (!renderProps) {
                result = {
                    error: "Not found",
                    status: 404
                };
            } else {
                const clientSize = getClientSize(cookies, request.query);

                matchMediaMock.setConfig({
                    type: "screen",
                    height: clientSize.height,
                    width: clientSize.width
                });

                const initialData = {};

                return Promise.all(
                    renderProps.components
                        .filter(component => component.prefetch)
                        .map(component => {
                            const prefetch = component.prefetch;
                            const key = prefetch.getKey();

                            return prefetch.run(renderProps).then(props => {
                                initialData[key] = prefetch[key] = props;
                            });
                        })
                ).then(() => {
                    const reactMarkup = ReactDOM.renderToStaticMarkup(
                        React.createElement(RoutingContext, renderProps)
                    );

                    const head = Object.assign({
                        link: "",
                        meta: "",
                        title: ""
                    }, Helmet.rewind());

                    const htmlTemplate = wildcatConfig.serverSettings.htmlTemplate || defaultTemplate;

                    const html = htmlTemplate({
                        data: initialData,
                        head: head,
                        html: reactMarkup,
                        wildcatConfig: wildcatConfig
                    });

                    result = Object.assign({}, result, {
                        html: html
                    });

                    return resolve(result);
                });
            }

            return resolve(result);
        });
    });
};
