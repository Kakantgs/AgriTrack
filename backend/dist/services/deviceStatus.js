const offlineAfterMinutes = Number(process.env.DEVICE_OFFLINE_AFTER_MINUTES ?? 10);
export function isDeviceOnline(device) {
    if (!device.online || !device.lastUpdatedAt) {
        return false;
    }
    const ageMs = Date.now() - new Date(device.lastUpdatedAt).getTime();
    return ageMs <= offlineAfterMinutes * 60000;
}
export function withComputedOnlineStatus(device) {
    return {
        ...device,
        online: isDeviceOnline(device)
    };
}
