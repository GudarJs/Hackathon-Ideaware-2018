const assert = require('chai').assert;
const axios = require('axios');

const Server = require('../../api/server');


describe('Server', () => {
    let server;
    beforeEach(() => {
        server = new Server(3000);
        server.listen();
    });
    afterEach(() => {
        server.close();
    });
    it('Server is healthy', (done) => {
        axios
            .get('http://localhost:3000/health')
            .then((response) => {
                assert.equal(response.status, 200);
                done();
            })
            .catch(err => console.error(err.message))
    });
});
