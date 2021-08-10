function initial(self) {
    const cvkey = `__${(0xbc729ba02bd1).toString(36)}_version-check-updater__`;
    let previousVersion = '';
    fetchVersion().then(versionJson => {
        previousVersion = versionJson.version;
        self.localStorage.setItem(cvkey, versionJson.version);
    }).catch(e => {
        console.warn(`Do initial check version failed cause: ${e.message || e.toString()}`);
    })

    /**
     * Get latest version.
     * @returns {Promise<{version: string}>}
     */
    function fetchVersion() {
        return new Promise((resolve, reject) => {
            fetch(`{{versionHashPath}}?tag=${Math.random().toString(36).slice(2)}`, {
                credentials: 'include',
                method: 'GET',
            }).then(res => {
                res.json().then(versionJson => resolve(versionJson));
            }).catch(e => reject(e));
        });
    }

    /**
     * Check if new version built.
     * @param {boolean} forceRefresh 
     * @returns {Promise<boolean>}
     */
    function versionCheckController(forceRefresh) {
        return new Promise((resolve, reject) => {
            fetchVersion().catch(e => reject(e)).then(versionJson => {
                if (versionJson.version === previousVersion) resolve(false);
                else {
                    self.localStorage.setItem(cvkey, versionJson.version);
                    if (forceRefresh) self.location.reload();
                    else resolve(true);
                }
            })
        });
    }

    self.$versionCheckController = versionCheckController;

    return versionCheckController;
}

export default initial(window);