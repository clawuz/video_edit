import React from "react";
import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import { productAdSchema, ProductAd, ProductAdProps } from "./compositions/ProductAd";
import { statsSchema, Stats, StatsProps } from "./compositions/Stats";
import { talkingHeadSchema, TalkingHead, TalkingHeadProps } from "./compositions/TalkingHead";

const productAdDefaults: ProductAdProps = {
  title: 'Your morning deserves better',
  features: ['Single Origin Beans', 'Roasted Fresh Weekly', 'Shipped to Your Door'],
  cta: 'mountainbrew.co',
  accentColor: '#e67e22',
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
};

const statsDefaults: StatsProps = {
  stats: [
    { value: '47%', label: 'Increase in Engagement' },
    { value: '2.3x', label: 'Return on Investment' },
    { value: '150+', label: 'Happy Clients' },
    { value: '$1.2M', label: 'Revenue Generated' },
  ],
  countUp: true,
  accentColor: '#3b82f6',
  backgroundColor: '#0f0f0f',
  fontFamily: 'sans-serif',
};

const talkingHeadDefaults: TalkingHeadProps = {
  subtitles: [
    { startMs: 0, endMs: 3000, text: 'Welcome to this video.' },
    { startMs: 3000, endMs: 6000, text: 'Here is some great content.' },
  ],
  lowerThird: 'Your Name — Title',
  logoUrl: '',
  accentColor: '#10b981',
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
};

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
      <Composition
        id="Stats"
        component={Stats}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={statsDefaults}
        schema={statsSchema}
      />
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={talkingHeadDefaults}
        schema={talkingHeadSchema}
      />
    </>
  );
};
