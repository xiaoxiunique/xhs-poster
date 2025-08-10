import axios, { type AxiosInstance } from "axios";

function base36encode(
  number: number,
  alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
  if (typeof number !== "number" || number % 1 !== 0) {
    throw new TypeError("number must be an integer");
  }

  let base36 = "";
  let sign = "";

  if (number < 0) {
    sign = "-";
    number = -number;
  }

  if (0 <= number && number < alphabet.length) {
    return sign + alphabet[number];
  }

  while (number !== 0) {
    const i = number % alphabet.length;
    number = Math.floor(number / alphabet.length);
    base36 = alphabet[i] + base36;
  }

  return sign + base36;
}

export function get_search_id() {
  const e = BigInt(Date.now()) << 64n;
  const t = BigInt(Math.floor(Math.random() * 2147483646));
  return base36encode(Number(e + t));
}

const EDITH_URL = "https://edith.xiaohongshv.com";
const CREATOR_URL = "https://creator.xiaohongshv.com";

export default class XhsPoster {
  #axios: AxiosInstance;

  constructor(cookie: string) {
    this.#axios = axios.create({
      baseURL: CREATOR_URL,
      headers: {
        authority: "edith.xiaohongshu.com",
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        authorization: "",
        "cache-control": "no-cache",
        cookie: cookie,
        pragma: "no-cache",
        referer: "https://creator.xiaohongshu.com/",
        origin: "https://creator.xiaohongshu.com/",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    });

    this.#axios.interceptors.response.use((response) => {
      return response.data;
    });
  }

  async permit({
    file_count = 1,
    scene = "image",
  }: {
    file_count: number;
    scene: string;
  }) {
    const response = await this.#axios.get(
      "/api/media/v1/upload/creator/permit",
      {
        params: {
          biz_name: "spectrum",
          scene,
          file_count,
          version: "1",
          source: "web",
        },
      }
    );

    const tempPermit = response.data.uploadTempPermits[0];
    const fileId = tempPermit.fileIds[0];
    const token = tempPermit.token;
    return [fileId, token];
  }

  async searchTopic(keyword: string): Promise<
    {
      name: string;
      link: string;
      view_num: number;
      type: string;
      smart: boolean;
      id: string;
    }[]
  > {
    const uri = "/web_api/sns/v1/search/topic";
    const data = {
      keyword,
      suggest_topic_request: {
        title: "",
        desc: `#${keyword}`,
      },
      page: {
        page_size: 20,
        page: 1,
      },
    };
    const res = await this.#axios.post(uri, data, {
      baseURL: EDITH_URL,
    });
    return res.data.topic_info_dtos;
  }

  async createNote(
    title: string,
    desc: string,
    noteType: string,
    ats: any[] = [],
    topics: any[] = [],
    imageInfo: object | null = null,
    videoInfo: object | null = null,
    postTime: string | null = null,
    isPrivate: boolean = true
  ): Promise<any> {
    if (postTime) {
      const postDateTime = new Date(postTime);
      postTime = postDateTime.getTime().toString();
    }
    const uri = "/web_api/sns/v2/note";
    const businessBinds = {
      version: 1,
      noteId: 0,
      noteOrderBind: {},
      notePostTiming: { postTime: postTime },
      noteCollectionBind: { id: "" },
    };

    if (topics.length > 0) {
      //  #理想L[话题]#
      desc =
        desc + "\n" + topics.map((topic) => `#${topic.name}[话题]#`).join(" ");
    }

    const data = {
      common: {
        type: noteType,
        title: title,
        note_id: "",
        desc: desc,
        source:
          '{"type":"web","ids":"","extraInfo":"{\\"subType\\":\\"official\\"}"}',
        business_binds: JSON.stringify(businessBinds),
        ats: ats,
        hash_tag: topics,
        post_loc: {},
        privacy_info: { op_type: 1, type: Number(isPrivate) },
      },
      image_info: imageInfo,
      video_info: videoInfo,
    };
    const headers = { Referer: "https://creator.xiaohongshu.com/" };
    return this.#axios.post(uri, data, {
      headers,
      baseURL: EDITH_URL,
    });
  }

  public async uploadFile(
    fileId: string,
    token: string,
    filePath: string,
    contentType: string = "image/jpeg"
  ): Promise<any> {
    const maxFileSize = 5 * 1024 * 1024;
    const url = `https://ros-upload.xiaohongshu.com/${fileId}`;

    // 处理在线文件
    const response = await axios.get(filePath, {
      responseType: "arraybuffer",
    });
    const fileData = response.data;
    const fileSize = Buffer.byteLength(fileData);

    if (fileSize > maxFileSize && contentType === "video/mp4") {
      throw new Error("video too large, < 5M");
    }

    const headers = {
      "X-Cos-Security-Token": token,
      "Content-Type": contentType,
    };

    return axios.put(url, fileData, { headers });
  }

  async createImageNote(
    title: string,
    desc: string,
    files: string[],
    postTime: string | null = null,
    ats: any[] = [],
    topics: any[] = [],
    isPrivate: boolean = true
  ): Promise<any> {
    const images = [];
    for (const file of files) {
      const [imageId, token] = await this.permit({
        file_count: 1,
        scene: "image",
      });
      await this.uploadFile(imageId, token, file);
      images.push({
        file_id: imageId,
        metadata: { source: -1 },
        stickers: { version: 2, floating: [] },
        extra_info_json: '{"mimeType":"image/jpeg"}',
      });
    }
    return this.createNote(
      title,
      desc,
      "normal",
      ats,
      topics,
      { images: images },
      null,
      postTime,
      isPrivate
    );
  }

  async myInfo() {
    return this.#axios.get("/api/galaxy/user/my-info");
  }

  async post_detail(note_id: string, xsec_token: string, xsec_source: string) {
    console.log("🚀 ~ XhsPoster ~ post_detail ~ note_id:", note_id, xsec_token, xsec_source)
    const uri = "/api/sns/web/v1/feed";
    const data = {
      source_note_id: note_id,
      image_formats: ["jpg", "webp", "avif"],
      extra: { need_body_topic: "1" },
      xsec_source: xsec_source,
      xsec_token: xsec_token
    };
    return this.#axios.post(uri, data, {
      baseURL: EDITH_URL,
    });
  }

  async user_posted(user_id: string, page = 0) {
    const uri = "/api/sns/web/v1/user_posted";
    const data = {
      num: 30,
      cursor: "",
      user_id: user_id,
      image_formats: "jpg,webp,avif",
    };

    return this.#axios.get(uri, {
      params: data,
      baseURL: EDITH_URL,
    });
  }

  async posted(page = 0) {
    return this.#axios.get(
      `/web_api/sns/v5/creator/note/user/posted?tab=0&page=${page}`,
      {
        baseURL: EDITH_URL,
      }
    );
  }

  async delete(note_id: string) {
    await this.#axios.post(
      "/web_api/sns/capa/postgw/permission/validate",
      {
        note_id: note_id,
        function_type: "delete",
      },
      {
        baseURL: EDITH_URL,
      }
    );

    return this.#axios.post(
      "/web_api/sns/capa/postgw/note/delete",
      {
        note_id: note_id,
      },
      {
        baseURL: EDITH_URL,
      }
    );
  }

  async deleteByView(view: number) {
    for (const index of Array.from(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    )) {
      const notes = await this.posted(index);

      for (const node of notes.data.notes) {
        if (node.view_count < view) {
          await this.delete(node.id);
          await new Promise((res) => setTimeout(res, 2000));
        }
      }
    }
  }

  public async getNoteByKeyword(
    keyword: string,
    page: number = 1,
    pageSize: number = 20,
    sort = "general",
    noteType = "all"
  ) {
    const uri = "/api/sns/web/v1/search/notes";
    const data = {
      keyword,
      page,
      page_size: pageSize,
      search_id: get_search_id(),
      sort: sort,
      note_type: noteType,
    };
    return this.#axios.post(uri, data, {
      baseURL: EDITH_URL,
    });
  }
}