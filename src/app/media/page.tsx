"use client";
import { useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";

const blogPosts = [
  {
    id: 1,
    title: "How Stan Mirzayev’s Parts Pass App is Helping Millions – and Disrupting the Auto Industry",
    href: "https://floridanationalnews.com/blog/how-stan-mirzayevs-parts-pass-app-is-helping-millions-and-disrupting-the-auto-industry/",
    description: "How Stan Mirzayev’s Parts Pass App is Helping Millions – and Disrupting the Auto Industry",
    imageUrl: "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_800,h_800/https://floridanationalnews.com/blog/wp-content/uploads/2023/05/Stan-Mirzayev-LinkedIn.jpg",
    date: "May 17, 2023",
    datetime: "2023-05-17",
    author: {
      name: "Stan Mirzayev",
      imageUrl:
        "https://media.licdn.com/dms/image/D5603AQHDORfkH0VBzA/profile-displayphoto-shrink_400_400/0/1688926871222?e=1723075200&v=beta&t=YiXVM_TmMeCeqZCOwpXRC155up4od4fo91jZSkq4FaQ",
    },
  },
  {
    id: 2,
    title: "Jeep Talk Show",
    href: "https://jeeptalkshow.com/episode-896-stan-of-partspass-app/",
    description:
      "Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde. Sed exercitationem placeat consectetur nulla deserunt vel. Iusto corrupti dicta.",
    imageUrl: "https://i0.wp.com/jeeptalkshow.com/wp-content/uploads/2019/07/cropped-jts-logo-linkedin-whitebackground-3.jpg?fit=1734%2C1312&ssl=1",
    date: "Mar 16, 2022",
    datetime: "2022-03-16",
    author: {
      name: "Stan Mirzayev",
      imageUrl:
        "https://media.licdn.com/dms/image/D5603AQHDORfkH0VBzA/profile-displayphoto-shrink_400_400/0/1688926871222?e=1723075200&v=beta&t=YiXVM_TmMeCeqZCOwpXRC155up4od4fo91jZSkq4FaQ",
    },
  },
  {
    id: 3,
    title: "Soul of Business",
    href: "https://www.youtube.com/watch?v=oiM85O0lNQ8&ab_channel=BlaineBartlett",
    description: "Where Do I Find That Part…I Need It NOW?",
    imageUrl: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts123/v4/11/ff/49/11ff4925-0ade-8f14-de97-2fea40572026/mza_7355194300809705142.png/626x0w.webp",
    date: "Sep 13, 2022",
    datetime: "2023-09-13",
    author: {
      name: "Stan Mirzayev",
      imageUrl:
        "https://media.licdn.com/dms/image/D5603AQHDORfkH0VBzA/profile-displayphoto-shrink_400_400/0/1688926871222?e=1723075200&v=beta&t=YiXVM_TmMeCeqZCOwpXRC155up4od4fo91jZSkq4FaQ",
    },
  },

  {
    id: 4,
    title: "I Am Living Proof Of The American Dream",
    href: "https://medium.com/authority-magazine/stan-mirzayev-of-parts-pass-i-am-living-proof-of-the-american-dream-a25d9edf308e",
    description: "An Interview With Jake Frankel",
    imageUrl: "https://miro.medium.com/v2/resize:fit:1400/1*SNn-oFlHA4dJX5Vxve_Mvw.jpeg",
    date: "Oct 13, 2022",
    datetime: "2023-10-13",
    author: {
      name: "Stan Mirzayev",
      imageUrl:
        "https://media.licdn.com/dms/image/D5603AQHDORfkH0VBzA/profile-displayphoto-shrink_400_400/0/1688926871222?e=1723075200&v=beta&t=YiXVM_TmMeCeqZCOwpXRC155up4od4fo91jZSkq4FaQ",
    },
  },
];

// https://miro.medium.com/v2/resize:fit:1400/1*SNn-oFlHA4dJX5Vxve_Mvw.jpeg

export default function MediaPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <Header />

      <main className="isolate">
        {/* Blog section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">PartsPass in the media</h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">Our Blog Posts and Pod Casts.</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article key={post.id} className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-80 sm:pt-48 lg:pt-80">
                <img src={post.imageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/40" />
                <div className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-gray-900/10" />

                <div className="flex flex-wrap items-center gap-y-1 overflow-hidden text-sm leading-6 text-gray-300">
                  <time dateTime={post.datetime} className="mr-8">
                    {post.date}
                  </time>
                  <div className="-ml-4 flex items-center gap-x-4">
                    <svg viewBox="0 0 2 2" className="-ml-0.5 h-0.5 w-0.5 flex-none fill-white/50">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <div className="flex gap-x-2.5">
                      <img src={post.author.imageUrl} alt="" className="h-6 w-6 flex-none rounded-full bg-white/10" />
                      {post.author.name}
                    </div>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-6 text-white">
                  <a href={post.href}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </a>
                </h3>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
