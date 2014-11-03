describe('Fuss.User', function () {
    var fuss;
    beforeEach(function () {
        fuss = new gajus.Fuss({appId: '820202914671347'});
    });
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