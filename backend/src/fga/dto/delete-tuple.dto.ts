import { CreateTupleDto } from './create-tuple.dto';

/** OpenFGA identifies tuples by their key, not by an id. */
export class DeleteTupleDto extends CreateTupleDto {}
