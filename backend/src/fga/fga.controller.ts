import { Body, Controller, Delete, Get, Post, Query, Req } from '@nestjs/common';
import { CheckRequestDto } from './dto/check-request.dto';
import { CreateTupleDto } from './dto/create-tuple.dto';
import { DeleteTupleDto } from './dto/delete-tuple.dto';
import { FgaService } from './fga.service';
import { RequestWithUser } from '../auth/jwt-auth.guard';

@Controller()
export class FgaController {
  constructor(private readonly fga: FgaService) {}

  @Post('check')
  check(@Body() dto: CheckRequestDto) {
    return this.fga.check(dto.userId, dto.permission, dto.namespace, dto.objectId);
  }

  @Get('tuples')
  listTuples(@Query('namespace') namespace?: string, @Query('objectId') objectId?: string) {
    return this.fga.listTuples(namespace, objectId);
  }

  @Post('tuples')
  createTuple(@Req() request: RequestWithUser, @Body() dto: CreateTupleDto) {
    const { namespace, objectId, relation, subject } = dto;
    return this.fga.createTuple(request.user.id, { namespace, objectId, relation, subject });
  }

  @Delete('tuples')
  deleteTuple(@Req() request: RequestWithUser, @Body() dto: DeleteTupleDto) {
    const { namespace, objectId, relation, subject } = dto;
    return this.fga.deleteTuple(request.user.id, { namespace, objectId, relation, subject });
  }
}
