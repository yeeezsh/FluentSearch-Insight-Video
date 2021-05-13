import { HttpService, Injectable } from '@nestjs/common';
import {
  DeepDetectRequestAPI,
  DeepDetectResponseAPI,
} from 'fluentsearch-types';
import { createWriteStream, promises } from 'fs';
import { join } from 'path';
import chunkArray from '../utils/chunkArray';
import { TMP_DIR_PATH } from '../video/video.service';

const MAX_INSGHT_ML_THREADS = 3;
const MODEL_SERVICE_NAME = 'detection_600';
const FLUENT_SEARCH_VIDEO_INSIGHT_HOSTNAME = 'FluentSearch-Insight-Video';
const FLUENT_SEARCH_VIDEO_INSIGHT_PORT = 3000;
@Injectable()
export class InsightService {
  constructor(private deepDetectEndpoint: HttpService) {}

  private async readDirQueue(dir: string) {
    return (await promises.readdir(dir, 'utf8')).filter((el) =>
      el.includes('.jpg'),
    );
  }

  private async endpointBuilder<T>(filePath: string) {
    const payload: DeepDetectRequestAPI = {
      service: MODEL_SERVICE_NAME,
      parameters: {
        output: {
          confidence_threshold: 0.2,
          bbox: true,
        },
        mllib: {
          gpu: false,
        },
      },
      data: [
        `http://${FLUENT_SEARCH_VIDEO_INSIGHT_HOSTNAME}:${FLUENT_SEARCH_VIDEO_INSIGHT_PORT}/file/${filePath}`,
      ],
    };

    return this.deepDetectEndpoint.post<T>('/predict', payload).toPromise();
  }

  async sendToInsight() {
    const queue = (await this.readDirQueue(TMP_DIR_PATH)).map((el, i) => ({
      i,
      filePath: el,
    }));

    const writeStream = createWriteStream(join(TMP_DIR_PATH, '/response.json'));
    const groupQueue = chunkArray(queue, MAX_INSGHT_ML_THREADS);

    writeStream.write('[');
    for (const [i, task] of groupQueue.entries()) {
      const responses = await Promise.all(
        task.map((t) =>
          this.endpointBuilder<DeepDetectResponseAPI>(t.filePath),
        ),
      );

      responses.forEach((r, ri) => {
        const parsed = { ...r?.data.body.predictions, nFps: i + ri };
        writeStream.write(JSON.stringify(parsed));
        writeStream.write(',');
        writeStream.write('\n');
      });
    }

    writeStream.write(']');
    writeStream.end();
  }
}