type ActorId = (string & { readonly __actorId: unique symbol }) | null;
type ActorUuid = string & { readonly __actorUuid: unique symbol };
