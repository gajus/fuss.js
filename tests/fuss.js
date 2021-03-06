var chai = require('chai'),
    expect = chai.expect,
    chaiAsPromised = require('chai-as-promised');
    nock = require('nock'),
    Sinon = require('sinon'),
    Promise = require('promise');

/**
 * @see http://stackoverflow.com/a/11477602/368691
 */
function requireNew (module) {
    var modulePath = require.resolve(module);
    
    delete require.cache[modulePath];

    return require(modulePath);
};

chai.use(chaiAsPromised);

describe('Fuss()', function () {
    var Fuss,
        config;
    beforeEach(function () {
        Fuss = requireNew('../src/fuss.js');
        config = {appId: '820202914671347', version: 'v2.1'};
    });

    it('requires config.appId', function () {
        delete config.appId;
        expect(function () {
            Fuss(config);
        }).to.throw(Error, 'Missing Fuss() config.appId.');
    });

    it('requires config.version', function () {
        delete config.version;
        expect(function () {
            Fuss(config);
        }).to.throw(Error, 'Missing Fuss() config.version.');
    });

    it('does not accept unknown configuration properties', function () {
        config.test = true;
        expect(function () {
            Fuss(config);
        }).to.throw(Error, 'Unknown configuration property ("test").');
    });

    describe('.login()', function () {
        var fuss;
        
        beforeEach(function () {
            fuss = Fuss({appId: '820202914671347', version: 'v2.1'});
        });

        it('does not accept unknown configuration properties', function () {
            expect(function () {
                fuss.login({test: true});
            }).to.throw(Error, 'Unknown fuss.login() option ("test").');
        });

        it('ensures that config.scope is an array', function () {
            expect(function () {
                fuss.login({scope: 'test'});
            }).to.throw(Error, 'fuss.login() option.scope must be an array.');
        });

        it('ensures that config.profileSelectorIds is an array', function () {
            expect(function () {
                fuss.login({profileSelectorIds: 'test'});
            }).to.throw(Error, 'fuss.login() option.profileSelectorIds must be an array.');
        });

        it('ensures that config.enableProfileSelector is a boolean', function () {
            expect(function () {
                fuss.login({enableProfileSelector: 'test'});
            }).to.throw(Error, 'fuss.login() option.enableProfileSelector must be a boolean.');
        });
    });
});

describe('Fuss', function () {
    var Fuss,
        fuss;
    beforeEach(function () {
        Fuss = requireNew('../src/fuss.js');
        fuss = Fuss({appId: '820202914671347', version: 'v2.1'});
    });
    //describe('.api()', function () {});
    //describe('.batch()', function () {});
    describe('User', function () {
        describe('.getPublicProfile()', function () {
            it('returns public profile', function () {
                var me,
                    publicProfile,
                    user;

                me = {
                    id: 'a',
                    first_name: 'b',
                    last_name: 'c',
                    link: 'd',
                    gender: 'e',
                    local: 'f',
                    age_range: 'g',
                    email: 'NOT PART OF THE PUBLIC PROFILE'
                };

                publicProfile = {
                    id: 'a',
                    first_name: 'b',
                    last_name: 'c',
                    link: 'd',
                    gender: 'e',
                    local: 'f',
                    age_range: 'g'
                };

                user = gajus.Fuss.User({me: me});

                expect(user.getPublicProfile()).to.deep.equal(publicProfile);
            });
        });
        describe('.getGrantedPermissions()', function () {
            it('returns granted permissions', function () {
                var permissions = {data: [{permission: 'a', status: 'granted'}, {permission: 'b', status: 'declined'}]},
                    user = gajus.Fuss.User({permissions: permissions});

                expect(user.getGrantedPermissions()).to.deep.equal(['a']);
            });
        });
    });
});