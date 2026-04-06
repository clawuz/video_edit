import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import { productAdSchema, ProductAd, ProductAdProps } from "./compositions/ProductAd";
// Stats and TalkingHead will be added in Tasks 3 and 4
// import { Stats, StatsProps } from "./compositions/Stats";
// import { TalkingHead, TalkingHeadProps } from "./compositions/TalkingHead";

const productAdDefaults: ProductAdProps = {
  title: 'Your morning deserves better',
  features: ['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'],
  cta: 'mountainbrew.co',
  accentColor: '#e67e22',
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
};

// statsDefaults and talkingHeadDefaults will be added in Tasks 3 and 4

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProductAd"
        component={ProductAd}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={productAdDefaults}
        schema={productAdSchema}
      />
      {/* Stats and TalkingHead compositions will be added in Tasks 3 and 4 */}
    </>
  );
};
