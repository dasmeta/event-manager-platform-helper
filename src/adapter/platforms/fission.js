/**
 * @param {Array} allContext List of platform function parameters.
 * @returns {Object}
 */
const getEvent = (allContext) => {
    return allContext[0].request.body;
}

/**
 * @param {Array} allContext List of platform function parameters.
 * @returns {string}
 */
const getTopic = (allContext) => {
    console.log('=== CONTEXT 5 ===');
    console.log(allContext[0].request.headers);
    console.log(allContext[0].request.body);
    return allContext[0].request.get('keda-topic');
}

/**
 * @param {Array} allContext List of platform function parameters.
 * @returns {string}
 */
const getFunctionName = (allContext) => {
    const deployedName = allContext[0].request.get('x-fission-function-name');
    // 0-is separator
    return deployedName.replace('0', '_')
}

/**
 *
 * @param response Handler response.
 * @returns {Object} Platform specific response
 */
const getResponse = (response) => {
    return {
        status: 200,
        body: ""
    }
}

module.exports = {
    getEvent,
    getTopic,
    getFunctionName,
    getResponse
}
