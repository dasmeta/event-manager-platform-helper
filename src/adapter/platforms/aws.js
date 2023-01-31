const getEvent = (allContext) => {
    return JSON.parse(allContext[0]['Records'][0]['Sns']['Message']);
}

const getTopic = (allContext) => {
    const arn = allContext[0]['Records'][0]['Sns']['TopicArn'];
    return arn.split(':').pop();
}

const getFunctionName = (allContext) => {
    return process.env.AWS_LAMBDA_FUNCTION_NAME;
}

const getResponse = (response) => {

}

module.exports = {
    getEvent,
    getTopic,
    getFunctionName,
    getResponse
}
