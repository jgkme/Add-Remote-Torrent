import { debug } from '../debug';

// Torrentflux API Handler

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
    } = torrentOptions;

    const loginUrl = `http${serverConfig.hostsecure ? 's' : ''}://${serverConfig.host}:${serverConfig.port}${serverConfig.torrentfluxrelativepath}/login.php`;
    const addUrl = `http${serverConfig.hostsecure ? 's' : ''}://${serverConfig.host}:${serverConfig.port}${serverConfig.torrentfluxrelativepath}/index.php`;

    try {
        // Login to create a session
        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${serverConfig.login}&iamhim=${serverConfig.password}`,
            credentials: 'include',
        });

        if (!loginResponse.ok) {
            return { success: false, error: { userMessage: `Torrentflux login request failed: ${loginResponse.status} ${loginResponse.statusText}` } };
        }

        const loginText = await loginResponse.text();
        if (loginText.includes("Password is required.") || loginText.includes("Login failed.")) {
            return { success: false, error: { userMessage: "Torrentflux credentials were not accepted." } };
        }

        // Send the torrent
        const formData = new FormData();
        if (torrentUrl.startsWith("magnet:")) {
            formData.append("url", torrentUrl);
        } else {
            const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
            formData.append("upload_file", blob, "file.torrent");
        }

        const response = await fetch(addUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Torrentflux add torrent request failed: ${response.status} ${response.statusText}` } };
        }

        const responseText = await response.text();
        if (responseText.includes("Torrent is already in the download list")) {
            return { success: false, error: { userMessage: "Torrent is already in the download list." } };
        }

        return { success: true, data: { message: "Torrent added successfully." } };
    } catch (error) {
        debug.error('Error adding torrent to Torrentflux:', error);
        return { success: false, error: { userMessage: `Could not contact Torrentflux: ${error.message}` } };
    }
}

export async function testConnection(serverConfig) {
    const loginUrl = `http${serverConfig.hostsecure ? 's' : ''}://${serverConfig.host}:${serverConfig.port}${serverConfig.torrentfluxrelativepath}/login.php`;
    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${serverConfig.login}&iamhim=${serverConfig.password}`,
            credentials: 'include',
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Torrentflux login request failed: ${response.status} ${response.statusText}` } };
        }

        const loginText = await response.text();
        if (loginText.includes("Password is required.") || loginText.includes("Login failed.")) {
            return { success: false, error: { userMessage: "Torrentflux credentials were not accepted." } };
        }

        return { success: true, data: { message: "Successfully connected to Torrentflux." } };
    } catch (error) {
        debug.error('Error testing connection to Torrentflux:', error);
        return { success: false, error: { userMessage: `Could not contact Torrentflux: ${error.message}` } };
    }
}
