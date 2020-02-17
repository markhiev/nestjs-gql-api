import { isEmpty } from 'lodash';
import { Op } from 'sequelize';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OptimisticLocking } from '../common/decorators';
import { MessageCodeError } from '../common/error/MessageCodeError';
import { WardStageCreateInput } from './input/ward-stage-create.input';
import { WardStageDeleteInput } from './input/ward-stage-delete.input';
import { WardStageUpdateInput } from './input/ward-stage-update.input';
import WardStage from './ward-stage.model';

@Injectable()
export class WardStageService {
  constructor(
    @Inject('WARD_STAGE_REPOSITORY')
    private readonly WARD_STAGE_REPOSITORY: typeof WardStage,
  ) {}

  public async checkVersion(id: string): Promise<WardStage | undefined> {
    try {
      return await this.WARD_STAGE_REPOSITORY.findOne<WardStage>({
        where: { id },
        attributes: ['version'],
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async wardStage(id: number): Promise<WardStage> {
    try {
      return await this.WARD_STAGE_REPOSITORY.findOne<WardStage | undefined>({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async wardStageList(
    textFilter: string,
    page: number,
    paging: number,
  ): Promise<WardStage[] | undefined> {
    try {
      const iRegexp: string = isEmpty(textFilter)
        ? ``
        : `(^${textFilter})|( ${textFilter})`;
      return await this.WARD_STAGE_REPOSITORY.findAll<WardStage>({
        limit: paging,
        offset: (page - 1) * paging,
        where: {
          wardStageName: {
            [Op.iRegexp]: iRegexp,
          },
        },
        order: [['wardStageName', 'ASC']],
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async wardStageNameFind(wardStageName: string): Promise<WardStage> {
    try {
      return await this.WARD_STAGE_REPOSITORY.findOne<WardStage | undefined>({
        where: { wardStageName },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async wardStageCreate(data: WardStageCreateInput): Promise<WardStage> {
    try {
      const wardStage = await this.wardStageNameFind(data.wardStageName);
      const wardStageName = wardStage?.getDataValue('wardStageName');

      if (wardStageName) {
        throw new MessageCodeError('wardStage:create:unableToCreateWardStage');
      }

      return await this.WARD_STAGE_REPOSITORY.create<WardStage>({
        ...data,
      });
    } catch (err) {
      throw new MessageCodeError('wardStage:create:unableToCreateWardStage');
    }
  }

  @OptimisticLocking(true)
  async wardStageUpdate(data: WardStageUpdateInput): Promise<WardStage> {
    try {
      const res = await this.WARD_STAGE_REPOSITORY.update<WardStage>(
        {
          ...data,
        },
        {
          where: { id: data.id },
          returning: true,
        },
      );
      const [, [val]] = res;
      return val;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  @OptimisticLocking(false)
  async wardStageDelete(data: WardStageDeleteInput): Promise<Number> {
    try {
      const { id, version } = data;
      return await this.WARD_STAGE_REPOSITORY.destroy({
        where: {
          [Op.and]: [{ id }, { version }],
        },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
