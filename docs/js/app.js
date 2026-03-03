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

    function isMobile() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    }

    // Parse key=value pairs from a URL hash fragment
    function parseHash(hash) {
        var params = {};
        hash.replace(/^#/, '').split('&').forEach(function (pair) {
            var parts = pair.split('=');
            if (parts.length === 2) {
                params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
            }
        });
        return params;
    }

    // Check if we're returning from a mobile OAuth redirect
    function handleOAuthReturn() {
        var hash = window.location.hash;
        if (!hash || hash.indexOf('access_token') === -1) {
            return false;
        }

        var params = parseHash(hash);
        var accessToken = params.access_token;
        var state = params.state;

        // Clean up the hash to prevent re-processing on refresh
        history.replaceState(null, '', window.location.pathname + window.location.search);

        // Recover the member token from state param, falling back to localStorage
        memberToken = state || localStorage.getItem('cvma_member_token');
        localStorage.removeItem('cvma_member_token');

        if (!accessToken || !memberToken) {
            showState('error');
            document.getElementById('error-message').textContent =
                'Facebook login completed but session data was lost. Please use the link from your email again.';
            return true;
        }

        // Call the Graph API directly (can't rely on FB SDK being loaded after redirect)
        showState('submitting');
        fetch('https://graph.facebook.com/' + CONFIG.FB_API_VERSION + '/me?fields=id,name&access_token=' + encodeURIComponent(accessToken))
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Graph API returned ' + response.status);
                }
                return response.json();
            })
            .then(function (me) {
                if (me && me.id) {
                    submitProfile({
                        token: memberToken,
                        fb_user_id: me.id,
                        fb_name: me.name,
                        fb_profile_url: 'https://www.facebook.com/' + me.id,
                        method: 'oauth'
                    });
                } else {
                    throw new Error('No profile data returned');
                }
            })
            .catch(function (err) {
                if (CONFIG.DEBUG) {
                    console.error('OAuth return error:', err);
                }
                showState('error');
                document.getElementById('error-message').textContent =
                    'Could not retrieve your Facebook profile. Please try again or use Option B (manual entry).';
            });

        return true;
    }

    // Facebook SDK initialization callback (used for desktop flow)
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
        if (isMobile()) {
            // Mobile: redirect to Facebook OAuth dialog (triggers native app)
            localStorage.setItem('cvma_member_token', memberToken);
            var oauthUrl = 'https://www.facebook.com/' + CONFIG.FB_API_VERSION + '/dialog/oauth'
                + '?client_id=' + encodeURIComponent(CONFIG.FB_APP_ID)
                + '&redirect_uri=' + encodeURIComponent(CONFIG.REDIRECT_URI)
                + '&response_type=token'
                + '&scope=public_profile'
                + '&state=' + encodeURIComponent(memberToken);
            window.location.href = oauthUrl;
            return;
        }

        // Desktop: use FB JS SDK popup
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
        // Check if returning from a mobile OAuth redirect first
        if (handleOAuthReturn()) {
            return;
        }

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
