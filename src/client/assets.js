const assets = [];
const downloadPromise = [];

function downloadAsset(assetName) {
  return new Promise(resolve => {
    const asset = new Image();
    assets[assetName] = new Image(1, 1);// temporary image. placed there unlil actually downloaded
    asset.src = `/${assetName}`;
    asset.onload = () => {
      console.log(`Downloaded ${assetName}`);
      assets[assetName] = asset;
      resolve();
    };
  });
}

export const downloadAssets = () => downloadPromise;

export function getAsset(assetName) {
  const a = assets[assetName];
  if (typeof a === 'undefined') {
    downloadAsset(assetName);
    return assets[assetName];
  } else return a;
}
