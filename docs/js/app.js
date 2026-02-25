(function () {
    'use strict';

    var memberToken = null;

    var states = {
        loading: document.getElementById('state-loading'),
        invalid: document.getElementById('state-invalid'),
        main: document.getElementById('state-main'),
        submitting: document.getElementById('state-submitting'),
        success: document.getElementById('state-success'),
        error: document.getElementById('state-error')
    };

    function showState(name) {
        Object.keys(states).forEach(function (key) {
            states[key].style.display = key === name ? 'block' : 'none';
        });
    }

    function extractToken() {
        var params = new URLSearchParams(window.location.search);
        return params.get('token');
    }

    // Facebook SDK initialization callback
    window.fbAsyncInit = function () {
        FB.init({
            appId: CONFIG.FB_APP_ID,
            cookie: true,
            xfbml: false,
            version: CONFIG.FB_API_VERSION
        });
        if (CONFIG.DEBUG) {
            console.log('Facebook SDK initialized');
        }
    };

    function handleFBLogin() {
        FB.login(function (response) {
            if (response.authResponse) {
                FB.api('/me', { fields: 'id,name' }, function (me) {
                    if (me && !me.error) {
                        submitProfile({
                            token: memberToken,
                            fb_user_id: me.id,
                            fb_name: me.name,
                            fb_profile_url: 'https://www.facebook.com/' + me.id,
                            method: 'oauth'
                        });
                    } else {
                        showState('error');
                        document.getElementById('error-message').textContent =
                            'Could not retrieve your Facebook profile. Please try Option B (manual entry) instead.';
                    }
                });
            }
            // If cancelled, do nothing — user stays on the form
        }, { scope: 'public_profile' });
    }

    function handleManualSubmit() {
        var input = document.getElementById('manual-fb-url');
        var url = input.value.trim();

        if (!url.match(/^https?:\/\/(www\.)?facebook\.com\/.+/i)) {
            input.setCustomValidity('Please enter a valid Facebook profile URL (e.g. https://www.facebook.com/yourname)');
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');

        submitProfile({
            token: memberToken,
            fb_user_id: null,
            fb_name: null,
            fb_profile_url: url,
            method: 'manual'
        });
    }

    function submitProfile(data) {
        showState('submitting');

        fetch(CONFIG.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function (response) {
                if (response.ok) {
                    showState('success');
                } else {
                    return response.text().then(function (text) {
                        throw new Error('Server returned ' + response.status + ': ' + text);
                    });
                }
            })
            .catch(function (err) {
                if (CONFIG.DEBUG) {
                    console.error('Submission error:', err);
                }
                showState('error');
                document.getElementById('error-message').textContent =
                    'Failed to submit your profile. Please try again. If the problem persists, contact your chapter PRO.';
            });
    }

    function init() {
        memberToken = extractToken();

        if (!memberToken) {
            showState('invalid');
            return;
        }

        showState('main');

        document.getElementById('btn-fb-login').addEventListener('click', handleFBLogin);
        document.getElementById('btn-manual-submit').addEventListener('click', handleManualSubmit);
        document.getElementById('btn-retry').addEventListener('click', function () {
            showState('main');
        });

        // Clear custom validity on input change
        document.getElementById('manual-fb-url').addEventListener('input', function () {
            this.setCustomValidity('');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
